import React from "react";
import { Label } from "./label";
import { Input } from "./input";
import { Button } from "./button";
import { UploadCloud } from "lucide-react";

export function FileUpload({
  onFileSelect,
}: {
  onFileSelect: (file: File) => void;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="document">Compliance Document (PDF)</Label>
      <div className="flex items-center space-x-2">
        <Input
          id="document"
          type="file"
          accept=".pdf"
          className="cursor-pointer"
          onChange={handleChange}
        />
        <Button variant="outline" size="icon" className="shrink-0">
          <UploadCloud className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Upload GDPR, HIPAA or other compliance PDFs
      </p>
    </div>
  );
}
