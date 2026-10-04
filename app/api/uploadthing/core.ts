import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({
    image: {
      maxFileSize: "4MB",
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
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
