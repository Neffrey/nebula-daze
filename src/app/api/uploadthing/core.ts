// LIBS
import { createUploadthing, type FileRouter } from "uploadthing/next";

// UTILS
import { getServerAuthSession } from "~/server/auth";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    // Set permissions and file types for this FileRoute
    .middleware(async () => {
      // This code runs on your server before upload
      const user = await getServerAuthSession();

      // If you throw, the user will not be able to upload
      if (!user) {
        throw new Error("Must be logged in to upload");
      }
      // if (!user?.user) console.log("no user");
      // throw new UploadThingError({
      //   code: "INTERNAL_SERVER_ERROR",
      //   message: "Must be logged in to upload",
      // });

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);

      // console.log("file url", file.url);

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
