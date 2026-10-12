import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { env } from "@/env";
import { viewerIsAdmin } from "@/lib/adminAuth";
import { maxImageNameLength, type LibraryImage } from "@/lib/imageLibrary";
import { sameOrigin } from "@/lib/places";

const utapi = new UTApi({ token: env.UPLOADTHING_TOKEN });
const pageSize = 500;
const maxPages = 20;

export async function GET(request: Request) {
  const denied = await guard(request);
  if (denied !== null) {
    return denied;
  }

  try {
    const appId = uploadthingAppId();
    const images: LibraryImage[] = [];
    for (let page = 0; page < maxPages; page++) {
      const { files, hasMore } = await utapi.listFiles({ limit: pageSize, offset: page * pageSize });
      for (const file of files) {
        if (file.status !== "Uploaded") {
          continue;
        }
        images.push({
          key: file.key,
          name: file.name,
          size: file.size,
          uploadedAt: file.uploadedAt,
          url: `https://${appId}.ufs.sh/f/${file.key}`,
        });
      }
      if (!hasMore) {
        break;
      }
    }
    images.sort((left, right) => right.uploadedAt - left.uploadedAt);
    return NextResponse.json({ images });
  } catch (error) {
    console.error("UploadThing list failed", error);
    return NextResponse.json({ error: "Unable to load images" }, { status: 502 });
  }
}

export async function PATCH(request: Request) {
  const denied = await guard(request);
  if (denied !== null) {
    return denied;
  }

  const body = await readBody(request);
  const key = readKey(body);
  const name = body !== null && "name" in body && typeof body.name === "string" ? body.name.trim() : "";
  if (key === null) {
    return NextResponse.json({ error: "Choose an image" }, { status: 400 });
  }
  if (name.length === 0 || name.length > maxImageNameLength) {
    return NextResponse.json(
      { error: `Name must be 1 to ${maxImageNameLength} characters` },
      { status: 400 },
    );
  }

  try {
    await utapi.renameFiles({ fileKey: key, newName: name });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("UploadThing rename failed", error);
    return NextResponse.json({ error: "Unable to rename the image" }, { status: 502 });
  }
}

export async function DELETE(request: Request) {
  const denied = await guard(request);
  if (denied !== null) {
    return denied;
  }

  const key = readKey(await readBody(request));
  if (key === null) {
    return NextResponse.json({ error: "Choose an image" }, { status: 400 });
  }

  try {
    const result = await utapi.deleteFiles(key);
    if (!result.success) {
      return NextResponse.json({ error: "Unable to delete the image" }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("UploadThing delete failed", error);
    return NextResponse.json({ error: "Unable to delete the image" }, { status: 502 });
  }
}

async function guard(request: Request) {
  if (request.method !== "GET" && !sameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!(await viewerIsAdmin())) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  return null;
}

async function readBody(request: Request) {
  try {
    const body: unknown = await request.json();
    return typeof body === "object" && body !== null ? body : null;
  } catch {
    return null;
  }
}

function readKey(body: object | null) {
  if (body === null || !("key" in body) || typeof body.key !== "string") {
    return null;
  }
  const key = body.key;
  return key.length > 0 && key.length <= 300 && /^[\w.-]+$/.test(key) ? key : null;
}

function uploadthingAppId() {
  const decoded: unknown = JSON.parse(Buffer.from(env.UPLOADTHING_TOKEN, "base64").toString("utf8"));
  if (
    typeof decoded !== "object" ||
    decoded === null ||
    !("appId" in decoded) ||
    typeof decoded.appId !== "string"
  ) {
    throw new Error("UPLOADTHING_TOKEN is missing an app id");
  }
  return decoded.appId;
}
