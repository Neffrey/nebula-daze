import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { viewerIsAdmin } from "@/lib/adminAuth";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      if (!(await isAuthenticatedNextjs())) {
        throw new UploadThingError("Unauthorized");
      }
      return { authenticated: true };
    })
    .onUploadComplete(async () => {
      return { uploaded: true };
    }),
  adminImageUploader: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 10,
    },
  })
    .middleware(async () => {
      if (!(await viewerIsAdmin())) {
        throw new UploadThingError("Unauthorized");
      }
      return { admin: true };
    })
    .onUploadComplete(async () => {
      return { uploaded: true };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
