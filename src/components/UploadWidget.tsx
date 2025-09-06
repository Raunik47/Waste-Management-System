"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { CldUploadWidget } from "next-cloudinary";

interface UploadWidgetProps {
  preview: string | null; // Current preview image URL (or null if none uploaded yet)
  setPreview: (url: string | null) => void; // Function to update preview state
  setNewReport: React.Dispatch<React.SetStateAction<any>>; // Function to update report data in parent
}

export default function UploadWidget({
  preview,
  setPreview,
  setNewReport,
}: UploadWidgetProps) {
  // Local state to track whether an upload is in progress
  const [isUploading, setIsUploading] = useState(false);

  return (
    <div className="mb-6">
      {/* Label above the upload area */}
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Upload Waste Image
      </label>

      {/* Cloudinary Upload Widget */}
      <CldUploadWidget
        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!} // Required preset (configured in Cloudinary dashboard)

        // Fires when upload is successful
        onSuccess={(result: any) => {
          // Cloudinary response may store URL under different keys
          const url =
            result?.info?.secure_url ||
            result?.info?.url ||
            result?.secure_url;

          if (url) {
            // Update preview (to show uploaded image)
            setPreview(url);

            // Update report data (so the uploaded image gets stored in DB later)
            setNewReport((prev: any) => ({ ...(prev || {}), image: url }));
          }

          // Mark upload as complete
          setIsUploading(false);
        }}

        // Fires when the widget is opened → mark as uploading
        onOpen={() => setIsUploading(true)}

        // Fires when widget is closed → ensure uploading state is reset
        onClose={() => setIsUploading(false)}
      >
        {({ open }) => (
          <div
            // Open Cloudinary widget when clicked
            onClick={() => open?.()}
            className="flex items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer hover:border-blue-400 transition-colors"
          >
            {preview ? (
              // If image is uploaded, show preview
              <img
                src={preview}
                alt="Uploaded preview"
                className="object-cover h-full w-full rounded-xl"
              />
            ) : (
              // If no image yet, show upload placeholder
              <div className="flex flex-col items-center text-gray-500">
                <Upload className="h-10 w-10 mb-2" />
                {isUploading ? "Uploading..." : "Click to upload"}
              </div>
            )}
          </div>
        )}
      </CldUploadWidget>
    </div>
  );
}
