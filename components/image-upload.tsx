// ImageUpload.tsx
"use client"
import { useState } from "react";
import { UploadDropzone } from "@/src/utils/uploadthing";
import Image from "next/image";

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload }) => {
  const [imageUrl, setImageUrl] = useState<string>("");

  return (
    <div>
      <UploadDropzone
        endpoint="imageUploader"
        onClientUploadComplete={(res) => {
          console.log("Files: ", res);
          alert("Upload Completed");
          setImageUrl(res[0].url);
          onImageUpload(res[0].url);
        }}
        onUploadError={(error: Error) => {
          alert(`ERROR! ${error.message}`);
        }}
      />

      {imageUrl.length ? (
        <div>
          <Image src={imageUrl} alt="my image" width={500} height={300} />
        </div>
      ) : null}
    </div>
  );
};

export default ImageUpload;
