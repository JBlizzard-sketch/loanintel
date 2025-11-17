import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface UploadResult {
  fileName: string;
  detectedType: string;
  rowCount: number;
  confidence: number;
  targetTable: string;
  preview: any[];
}

export default function DataUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const analyzeMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiRequest<UploadResult>("/api/upload/analyze", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: (data) => {
      setUploadResult(data);
      toast({
        title: "File analyzed successfully",
        description: `Detected as ${data.detectedType} with ${data.confidence}% confidence`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: error.message || "Failed to analyze file",
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("No file selected");
      const formData = new FormData();
      formData.append("file", file);
      return apiRequest("/api/upload/import", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: () => {
      toast({
        title: "Upload successful",
        description: "Data has been imported successfully",
      });
      setFile(null);
      setUploadResult(null);
      queryClient.invalidateQueries({ queryKey: ["/api"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Failed to import data",
      });
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFile(file);
      analyzeMutation.mutate(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFile(file);
      analyzeMutation.mutate(file);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Upload</h1>
        <p className="text-muted-foreground mt-1">
          Intelligent CSV/Excel upload with Groq-powered schema inference
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Data File</CardTitle>
          <CardDescription>
            Upload CSV or Excel files. Our AI will automatically detect the data type and route it to the correct table.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive ? 'border-primary bg-primary/5' : 'border-border'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            data-testid="dropzone-upload"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  Drop your file here
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports CSV and Excel files (up to 50MB)
                </p>
                <label htmlFor="file-upload">
                  <Button asChild>
                    <span data-testid="button-browse-file">Browse Files</span>
                  </Button>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                />
              </div>
              {file && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">{file.name}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {analyzeMutation.isPending && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Analyzing file with Groq AI...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {uploadResult && (
        <Card data-testid="card-upload-result">
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-chart-2" />
                  Analysis Complete
                </CardTitle>
                <CardDescription className="mt-1">
                  {uploadResult.fileName}
                </CardDescription>
              </div>
              <Badge variant="default">
                {uploadResult.confidence}% confidence
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Detected Type</div>
                <div className="font-semibold">{uploadResult.detectedType}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Target Table</div>
                <div className="font-semibold">{uploadResult.targetTable}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Row Count</div>
                <div className="font-semibold">{uploadResult.rowCount.toLocaleString()}</div>
              </div>
            </div>

            {uploadResult.preview && uploadResult.preview.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                  Data Preview (first 5 rows)
                </h4>
                <div className="border rounded-lg overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        {Object.keys(uploadResult.preview[0]).map(key => (
                          <th key={key} className="px-4 py-3 text-left font-semibold">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {uploadResult.preview.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                          {Object.values(row).map((value: any, cellIdx) => (
                            <td key={cellIdx} className="px-4 py-3">
                              {String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => uploadMutation.mutate()}
                disabled={uploadMutation.isPending}
                data-testid="button-confirm-upload"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirm & Import
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setUploadResult(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
