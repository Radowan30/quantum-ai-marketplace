import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Upload,
  FileText,
  Code,
  Users,
  X,
  Plus,
  Info,
  Trash2,
  Loader2,
  ChevronsUpDown,
  Send,
  FileX,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  uploadFileWithProgress,
  saveExternalUrl,
  validateFile,
  formatFileSize,
  fetchModelFiles,
  deleteFile,
  downloadFile,
} from "@/lib/file-upload";
import {
  fetchModelById,
  updateModel,
  fetchCollaborators,
  updateCollaborators,
} from "@/lib/api";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { Category } from "@/lib/types";
import { ApiSpecRenderer } from "@/components/ApiSpecRenderer";
import { triggerModelUpdateNotifications } from "@/lib/notification-triggers";

const STEPS = [
  { id: 1, title: "General Info", icon: FileText },
  { id: 2, title: "Technical Details", icon: Code },
  { id: 3, title: "Files & Assets", icon: Upload },
  { id: 4, title: "Collaborators", icon: Users },
];

interface Publisher {
  id: string;
  name: string;
  email: string;
}

interface Collaborator {
  email: string;
  name: string;
  role?: string;
}

interface FileEntry {
  id: string;
  name: string;
  type: "upload" | "url";
  description?: string;
  file?: File;
  url?: string;
  size?: number;
  fileId?: string; // Database file ID
  filePath?: string; // Storage path (for deleting uploaded files)
  uploading?: boolean;
  uploadProgress?: number;
}

// Helper function to get user initials
const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export default function EditModelPage() {
  const [, params] = useRoute("/publisher/edit-model/:id");
  const modelId = params?.id;
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const [model, setModel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Publishers state
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loadingPublishers, setLoadingPublishers] = useState(true);

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [newCategoryDialogOpen, setNewCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Tab 1: General Info state
  const [modelName, setModelName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [version, setVersion] = useState("");
  const [priceType, setPriceType] = useState<"free" | "paid" | "">("");
  const [price, setPrice] = useState("");
  const [detailedDescription, setDetailedDescription] = useState("");
  const [liveLink, setLiveLink] = useState("");

  // Tab 2: Technical Details state
  const [featuresInput, setFeaturesInput] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [responseTime, setResponseTime] = useState("");
  const [accuracy, setAccuracy] = useState("");
  const [apiSpecFormat, setApiSpecFormat] = useState("json");
  const [apiSpec, setApiSpec] = useState("");
  const [apiSpecPreview, setApiSpecPreview] = useState(false);

  // Tab 3: Files state
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<"upload" | "url">("upload");
  const [fileUrl, setFileUrl] = useState("");
  const [fileDescription, setFileDescription] = useState("");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(
    null,
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileEntry | null>(null);

  // Tab 4: Collaborators state
  const [collabEmail, setCollabEmail] = useState("");
  const [collabName, setCollabName] = useState("");
  const [selectedPublisher, setSelectedPublisher] = useState("");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  // Fetch model and files from database
  useEffect(() => {
    const loadModel = async () => {
      if (!modelId) return;

      try {
        setLoading(true);
        const fetchedModel = await fetchModelById(modelId);
        setModel(fetchedModel);

        // Pre-fill form with existing model data
        setModelName(fetchedModel.name);
        setShortDescription(fetchedModel.shortDescription);
        setDetailedDescription(fetchedModel.detailedDescription);
        setVersion(fetchedModel.version);
        setPriceType(fetchedModel.price);
        setPrice(fetchedModel.priceAmount?.toString() || "");
        setFeatures(fetchedModel.features);
        setResponseTime(fetchedModel.stats.responseTime.toString());
        setAccuracy(fetchedModel.stats.accuracy.toString());
        setApiSpec(fetchedModel.apiDocumentation || "");
        setApiSpecFormat(fetchedModel.apiSpecFormat || "json");
        setLiveLink(fetchedModel.liveLink || "");

        // Fetch model's categories
        const { data: modelCategoriesData, error: modelCategoriesError } =
          await supabase
            .from("model_categories")
            .select("category_id")
            .eq("model_id", modelId);

        if (!modelCategoriesError && modelCategoriesData) {
          setSelectedCategories(
            modelCategoriesData.map((mc: any) => mc.category_id),
          );
        }

        // Fetch existing files
        const existingFiles = await fetchModelFiles(modelId);
        const mappedFiles: FileEntry[] = existingFiles.map((file: any) => ({
          id: file.id,
          name: file.file_name,
          type: file.file_type,
          description: file.description,
          url: file.file_url,
          size: file.file_size,
          fileId: file.id,
          filePath: file.file_path,
        }));
        setFiles(mappedFiles);

        // Fetch existing collaborators
        const existingCollaborators = await fetchCollaborators(modelId);
        const mappedCollaborators: Collaborator[] = existingCollaborators.map(
          (collab: any) => ({
            email: collab.email,
            name: collab.name,
            role: "Collaborator",
          }),
        );
        setCollaborators(mappedCollaborators);
      } catch (error: any) {
        console.error("Error loading model:", error);
        toast({
          title: "Error loading model",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadModel();
  }, [modelId]);

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);

        const { data, error } = await supabase
          .from("categories")
          .select("id, name, is_custom")
          .order("is_custom", { ascending: true })
          .order("name", { ascending: true });

        if (error) {
          console.error("Error fetching categories:", error);
          toast({
            title: "Error loading categories",
            description: "Could not load category list. Please try again.",
            variant: "destructive",
          });
          return;
        }

        setCategories(data || []);
      } catch (error) {
        console.error("Error in fetchCategories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [toast]);

  // Fetch publishers from database (for collaborators dropdown)
  useEffect(() => {
    const fetchPublishers = async () => {
      if (!user?.id) return;

      try {
        setLoadingPublishers(true);

        // Query for all users with publisher role, excluding current user
        const { data, error } = await supabase
          .from("user_roles")
          .select(
            `
            user_id,
            users!inner (
              id,
              name,
              email
            ),
            roles!inner (
              role_name
            )
          `,
          )
          .eq("roles.role_name", "publisher")
          .neq("user_id", user.id);

        if (error) {
          console.error("Error fetching publishers:", error);
          return;
        }

        // Transform data to Publisher format
        const publisherList: Publisher[] = (data || [])
          .map((item: any) => ({
            id: item.users.id,
            name: item.users.name,
            email: item.users.email,
          }))
          .filter(
            (pub: Publisher, index: number, self: Publisher[]) =>
              // Remove duplicates based on id
              index === self.findIndex((p) => p.id === pub.id),
          );

        setPublishers(publisherList);
      } catch (error) {
        console.error("Error in fetchPublishers:", error);
      } finally {
        setLoadingPublishers(false);
      }
    };

    fetchPublishers();
  }, [user?.id]);

  // Create custom category handler
  const handleCreateCustomCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    // Check if category already exists
    if (
      categories.some(
        (cat) =>
          cat.name.toLowerCase() === newCategoryName.trim().toLowerCase(),
      )
    ) {
      toast({
        title: "Category Exists",
        description: "This category already exists.",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreatingCategory(true);

      const { data, error } = await supabase
        .from("categories")
        .insert({
          name: newCategoryName.trim(),
          is_custom: true,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating category:", error);
        toast({
          title: "Error Creating Category",
          description: "Could not create category. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Add to categories list
      setCategories([...categories, data]);

      // Auto-select the new category
      setSelectedCategories([...selectedCategories, data.id]);

      toast({
        title: "Category Created",
        description: `"${data.name}" has been added to your categories.`,
      });

      // Close dialog and reset
      setNewCategoryDialogOpen(false);
      setNewCategoryName("");
    } catch (error) {
      console.error("Error in handleCreateCustomCategory:", error);
    } finally {
      setCreatingCategory(false);
    }
  };

  // Toggle category selection
  const toggleCategorySelection = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  // Loading or not found states
  if (loading) {
    return (
      <Layout type="dashboard">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4 [stroke-width:1.5]" />
          <p className="text-muted-foreground">Loading model...</p>
        </div>
      </Layout>
    );
  }

  if (!model) {
    return (
      <Layout type="dashboard">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <h2 className="text-2xl font-bold mb-4">Model Not Found</h2>
          <Button onClick={() => setLocation("/publisher/my-models")}>
            Back to My Models
          </Button>
        </div>
      </Layout>
    );
  }

  // Validation for Tab 1: General Info
  const isTab1Complete = () => {
    const basicValidation =
      modelName.trim().length > 0 &&
      modelName.length <= 25 &&
      shortDescription.trim().length > 0 &&
      shortDescription.length <= 700 &&
      selectedCategories.length > 0 &&
      version.trim().length > 0 &&
      priceType !== "";

    // If paid, price must be filled and greater than 0
    if (priceType === "paid") {
      return (
        basicValidation && price.trim().length > 0 && parseFloat(price) > 0
      );
    }

    return basicValidation;
  };

  // Validation for Tab 2: Technical Details - Response Time and Accuracy are required
  const isTab2Complete = () => {
    return responseTime.trim().length > 0 && accuracy.trim().length > 0;
  };

  // Validation for Tab 3: Files - At least one file must be added
  const isTab3Complete = () => {
    return files.length > 0;
  };

  // Tab 4: Collaborators - Optional (no required fields)
  // Shows purple highlight if collaborators added, but not a checkmark
  const isTab4Complete = () => {
    return false; // Never shows checkmark since it's optional
  };

  // Check if Tab 4 has collaborators (for purple highlighting)
  const hasCollaborators = () => {
    return collaborators.length > 0;
  };

  // Check if a specific tab is complete
  const isTabComplete = (tabNumber: number) => {
    switch (tabNumber) {
      case 1:
        return isTab1Complete();
      case 2:
        return isTab2Complete();
      case 3:
        return isTab3Complete();
      case 4:
        return isTab4Complete();
      default:
        return false;
    }
  };

  // Check if all required fields across all tabs are complete
  const isAllRequiredFieldsComplete = () => {
    return isTab1Complete() && isTab2Complete() && isTab3Complete();
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!isAllRequiredFieldsComplete()) {
      const missingFields = [];
      if (!isTab1Complete()) missingFields.push("General Info");
      if (!isTab2Complete())
        missingFields.push("Technical Details (Response Time & Accuracy)");
      if (!isTab3Complete())
        missingFields.push("Files & Assets (at least one file)");

      toast({
        title: "Validation Error",
        description: `Please complete all required fields: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    if (!user || !modelId) {
      toast({
        title: "Error",
        description: "Authentication error. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Detect changes for notification purposes
      const changes: Array<{ field: string; oldValue: any; newValue: any }> =
        [];

      // Track changes for buyer notifications
      if (modelName !== model.name) {
        changes.push({
          field: "name",
          oldValue: model.name,
          newValue: modelName,
        });
      }
      if (version !== model.version) {
        changes.push({
          field: "version",
          oldValue: model.version,
          newValue: version,
        });
      }
      if (features !== model.features) {
        changes.push({
          field: "features",
          oldValue: model.features,
          newValue: features,
        });
      }
      if (parseFloat(responseTime) !== model.response_time) {
        changes.push({
          field: "response_time",
          oldValue: model.response_time,
          newValue: parseFloat(responseTime),
        });
      }
      if (parseFloat(accuracy) !== model.accuracy) {
        changes.push({
          field: "accuracy",
          oldValue: model.accuracy,
          newValue: parseFloat(accuracy),
        });
      }
      if ((apiSpec || null) !== model.api_documentation) {
        changes.push({
          field: "api_documentation",
          oldValue: model.api_documentation,
          newValue: apiSpec || null,
        });
      }
      if (priceType !== model.subscription_type) {
        changes.push({
          field: "subscription_type",
          oldValue: model.subscription_type,
          newValue: priceType,
        });
      }
      if (priceType === "paid" && parseFloat(price) !== model.price_amount) {
        changes.push({
          field: "subscription_price",
          oldValue: model.price_amount,
          newValue: parseFloat(price),
        });
      }
      if (detailedDescription !== model.detailed_description) {
        changes.push({
          field: "detailed_description",
          oldValue: model.detailed_description,
          newValue: detailedDescription,
        });
      }
      if (shortDescription !== model.short_description) {
        changes.push({
          field: "short_description",
          oldValue: model.short_description,
          newValue: shortDescription,
        });
      }

      // Step 2: Update the model
      const updates = {
        name: modelName,
        shortDescription: shortDescription,
        detailedDescription: detailedDescription,
        version: version,
        features: features,
        responseTime: parseFloat(responseTime),
        accuracy: parseFloat(accuracy),
        apiDocumentation: apiSpec || null,
        apiSpecFormat: apiSpecFormat,
        liveLink: liveLink.trim() || null,
        status: model.status,
        subscriptionType: priceType,
        priceAmount: priceType === "paid" ? parseFloat(price) : null,
      };

      await updateModel(modelId, updates);

      // Step 3: Trigger notifications for buyers if there are changes
      if (changes.length > 0) {
        await triggerModelUpdateNotifications({
          modelId: modelId,
          modelName: modelName,
          changes: changes,
        });
      }

      // Step 4: Update categories in junction table
      // First, delete all existing category associations
      const { error: deleteError } = await supabase
        .from("model_categories")
        .delete()
        .eq("model_id", modelId);

      if (deleteError) {
        console.error("Error deleting old categories:", deleteError);
      }

      // Then, insert new category associations
      if (selectedCategories.length > 0) {
        const categoryInserts = selectedCategories.map((categoryId) => ({
          model_id: modelId,
          category_id: categoryId,
        }));

        const { error: insertError } = await supabase
          .from("model_categories")
          .insert(categoryInserts);

        if (insertError) {
          console.error("Error inserting categories:", insertError);
          toast({
            title: "Warning",
            description: "Model updated but categories could not be saved.",
            variant: "destructive",
          });
        }
      }

      // Step 5: Update collaborators (smart diff-based update)
      let collaboratorSelfRemovalAttempted = false;
      try {
        const currentUserEmail = userProfile?.email || user?.email || "";
        const isModelOwner = model?.publisher_id === user?.id;

        const result = await updateCollaborators(
          modelId,
          collaborators.map((c) => ({ name: c.name, email: c.email })),
          currentUserEmail,
          isModelOwner,
        );

        // Track if self-removal was attempted (will show warning at the end)
        collaboratorSelfRemovalAttempted = result.selfRemovalAttempted;
      } catch (collabError: any) {
        console.error("Error updating collaborators:", collabError);
        toast({
          title: "Warning",
          description: "Model updated but collaborators could not be saved.",
          variant: "destructive",
        });
      }

      // Step 6: Upload any new files (those without fileId)
      const newFiles = files.filter((f) => !f.fileId);
      for (let i = 0; i < newFiles.length; i++) {
        const fileEntry = newFiles[i];
        const fileIndex = files.indexOf(fileEntry);

        if (fileEntry.type === "upload" && fileEntry.file) {
          // Upload file to storage
          await uploadFileWithProgress(
            fileEntry.file,
            user.id,
            modelId,
            fileEntry.description,
            (progress) => {
              setFiles((prev) =>
                prev.map((f, idx) =>
                  idx === fileIndex
                    ? { ...f, uploadProgress: progress, uploading: true }
                    : f,
                ),
              );
            },
          );

          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex
                ? { ...f, uploading: false, uploadProgress: 100 }
                : f,
            ),
          );
        } else if (fileEntry.type === "url" && fileEntry.url) {
          // Save external URL
          await saveExternalUrl(
            modelId,
            fileEntry.name,
            fileEntry.url,
            fileEntry.description,
          );
        }
      }

      // Show appropriate message based on what happened
      if (collaboratorSelfRemovalAttempted) {
        toast({
          title: "Cannot Remove Yourself",
          description:
            "Model updated, but you cannot remove yourself from the collaborators list. Only the model owner or another collaborator can remove you.",
          variant: "destructive",
        });
        // Don't redirect - stay on page so user can see they're still a collaborator
      } else {
        toast({
          title: "Model Updated Successfully",
          description: "Your changes have been saved.",
        });
        setLocation("/publisher/my-models");
      }
    } catch (error: any) {
      console.error("Error updating model:", error);
      toast({
        title: "Error Updating Model",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!isAllRequiredFieldsComplete()) {
      const missingFields = [];
      if (!isTab1Complete()) missingFields.push("General Info");
      if (!isTab2Complete())
        missingFields.push("Technical Details (Response Time & Accuracy)");
      if (!isTab3Complete())
        missingFields.push("Files & Assets (at least one file)");

      toast({
        title: "Cannot Publish",
        description: `Please complete all required fields first: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    if (!user || !modelId) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("models")
        .update({
          status: "published",
          updated_at: new Date().toISOString(),
          published_on: new Date().toISOString(),
        })
        .eq("id", modelId);

      if (error) throw error;

      setModel({ ...model, status: "published" });

      toast({
        title: "Model Published",
        description: "Your model is now live on the marketplace.",
      });
    } catch (error: any) {
      console.error("Error publishing model:", error);
      toast({
        title: "Error Publishing Model",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnpublish = async () => {
    if (!user || !modelId) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("models")
        .update({
          status: "draft",
          updated_at: new Date().toISOString(),
        })
        .eq("id", modelId);

      if (error) throw error;

      setModel({ ...model, status: "draft" });

      toast({
        title: "Model Unpublished",
        description: "Your model has been unpublished and is now a draft.",
      });
    } catch (error: any) {
      console.error("Error unpublishing model:", error);
      toast({
        title: "Error Unpublishing Model",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tab 2: Add feature handler
  const handleAddFeature = () => {
    if (featuresInput.trim()) {
      const newFeatures = featuresInput
        .split(",")
        .map((f) => f.trim())
        .filter((f) => f.length > 0);
      setFeatures([...features, ...newFeatures]);
      setFeaturesInput("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  // Tab 3: Add file handler
  const handleAddFile = () => {
    if (!fileName.trim()) {
      toast({
        title: "Validation Error",
        description: "File name is required.",
        variant: "destructive",
      });
      return;
    }

    if (fileType === "upload") {
      if (!selectedFile) {
        toast({
          title: "Validation Error",
          description: "Please select a file to upload.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size
      const validation = validateFile(selectedFile);
      if (!validation.valid) {
        toast({
          title: "Validation Error",
          description: validation.error,
          variant: "destructive",
        });
        return;
      }
    } else if (fileType === "url" && !fileUrl.trim()) {
      toast({
        title: "Validation Error",
        description: "External URL is required.",
        variant: "destructive",
      });
      return;
    }

    const newFile: FileEntry = {
      id: Date.now().toString(),
      name: fileName,
      type: fileType,
      description: fileDescription,
      url: fileType === "url" ? fileUrl : undefined,
      file: fileType === "upload" ? selectedFile! : undefined,
      size: fileType === "upload" ? selectedFile!.size : undefined,
    };

    setFiles([...files, newFile]);

    // Clear form
    setFileName("");
    setFileUrl("");
    setFileDescription("");
    setSelectedFile(null);
  };

  const handleRemoveFile = (id: string) => {
    const file = files.find((f) => f.id === id);
    if (!file) return;

    setFileToDelete(file);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;

    // If file is already in database, delete it from storage and database
    if (fileToDelete.fileId) {
      try {
        await deleteFile(fileToDelete.fileId, fileToDelete.filePath);
        toast({
          title: "File Deleted",
          description: `${fileToDelete.name} has been removed.`,
        });
      } catch (error: any) {
        console.error("Error deleting file:", error);
        toast({
          title: "Error deleting file",
          description: error.message,
          variant: "destructive",
        });
        setDeleteDialogOpen(false);
        setFileToDelete(null);
        return;
      }
    }

    // Remove from local state
    setFiles(files.filter((f) => f.id !== fileToDelete.id));
    setDeleteDialogOpen(false);
    setFileToDelete(null);
  };

  const handleDownloadFile = async (file: FileEntry) => {
    if (!modelId || !user || !file.fileId || !file.filePath) return;

    try {
      setDownloadingFileId(file.id);

      // Download file with signed URL
      await downloadFile(
        file.fileId,
        file.filePath,
        file.name,
        modelId,
        user.id,
      );

      toast({
        title: "Download Started",
        description: `Downloading ${file.name}...`,
      });
    } catch (error: any) {
      console.error("Error downloading file:", error);
      toast({
        title: "Error downloading file",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDownloadingFileId(null);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      const file = droppedFiles[0];

      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        toast({
          title: "Invalid File",
          description: validation.error,
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  // Tab 4: Add collaborator by email handler
  const handleAddCollaborator = () => {
    if (!collabEmail.trim() || !collabName.trim()) {
      toast({
        title: "Validation Error",
        description: "All fields are required to add a collaborator.",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(collabEmail)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    // Check if already added
    if (collaborators.some((c) => c.email === collabEmail)) {
      toast({
        title: "Already Added",
        description: "This collaborator is already in the list.",
        variant: "destructive",
      });
      return;
    }

    const newCollab: Collaborator = {
      email: collabEmail,
      name: collabName,
      role: "Collaborator",
    };

    setCollaborators([...collaborators, newCollab]);

    // Clear form
    setCollabEmail("");
    setCollabName("");
  };

  // Tab 4: Add existing publisher handler
  const handleAddPublisher = () => {
    if (!selectedPublisher) return;

    const publisher = publishers.find((p) => p.id === selectedPublisher);
    if (!publisher) return;

    // Check if already added
    if (collaborators.some((c) => c.email === publisher.email)) {
      toast({
        title: "Already Added",
        description: "This publisher is already in the collaborators list.",
        variant: "destructive",
      });
      return;
    }

    const newCollab: Collaborator = {
      email: publisher.email,
      name: publisher.name,
      role: "Publisher",
    };

    setCollaborators([...collaborators, newCollab]);
    setSelectedPublisher("");
  };

  const handleRemoveCollaborator = (email: string) => {
    setCollaborators(collaborators.filter((c) => c.email !== email));
  };

  return (
    <Layout type="dashboard">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/publisher/my-models")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-heading font-bold">Edit Model</h1>
              <p className="text-muted-foreground">
                Update your model information.
              </p>
            </div>
          </div>
          {model?.status === "published" && (
            <Button
              variant="outline"
              onClick={handleUnpublish}
              disabled={isSubmitting}
              className="gap-2"
            >
              <FileX className="w-4 h-4" />
              Unpublish Model
            </Button>
          )}
        </div>

        {/* Wizard Progress */}
        <div className="relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-secondary -z-10 -translate-y-1/2 rounded-full" />
          <div
            className="absolute top-1/2 left-0 h-1 bg-primary -z-10 -translate-y-1/2 rounded-full transition-all duration-300"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />
          <div className="flex justify-between">
            {STEPS.map((s) => {
              const isComplete = isTabComplete(s.id);
              const isCurrent = step === s.id;
              // Special case for Tab 4: show purple highlight if has collaborators
              const isTab4WithCollaborators = s.id === 4 && hasCollaborators();

              return (
                <div
                  key={s.id}
                  className="flex flex-col items-center gap-2 bg-background p-2 cursor-pointer"
                  onClick={() => setStep(s.id)}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                      isComplete
                        ? "border-primary bg-primary text-primary-foreground shadow-lg"
                        : isCurrent || isTab4WithCollaborators
                          ? "border-primary bg-background text-primary"
                          : "border-muted-foreground/30 bg-background text-muted-foreground",
                    )}
                  >
                    {isComplete ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <s.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isComplete || isCurrent || isTab4WithCollaborators
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Content */}
        <Card className="min-h-[400px] border-border/50 shadow-md">
          <CardContent className="p-8">
            {/* TAB 1: GENERAL INFO */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>
                      Model Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="e.g. Traffic Pattern Analyzer Pro"
                      value={modelName}
                      onChange={(e) =>
                        setModelName(e.target.value.slice(0, 25))
                      }
                      maxLength={25}
                    />
                    <p
                      className={cn(
                        "text-xs",
                        modelName.length > 20
                          ? "text-destructive"
                          : "text-muted-foreground",
                      )}
                    >
                      {modelName.length} / 25 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Short Description{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="Brief summary of what your model does"
                      value={shortDescription}
                      onChange={(e) =>
                        setShortDescription(e.target.value.slice(0, 700))
                      }
                      maxLength={700}
                    />
                    <p
                      className={cn(
                        "text-xs",
                        shortDescription.length > 650
                          ? "text-destructive"
                          : "text-muted-foreground",
                      )}
                    >
                      {shortDescription.length} / 700 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Categories <span className="text-destructive">*</span>
                    </Label>
                    <Popover
                      open={categoryPopoverOpen}
                      onOpenChange={setCategoryPopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={categoryPopoverOpen}
                          className="w-full justify-between"
                          disabled={loadingCategories}
                        >
                          {loadingCategories
                            ? "Loading categories..."
                            : selectedCategories.length > 0
                              ? `${selectedCategories.length} selected`
                              : "Select categories..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search categories..." />
                          <CommandEmpty>No category found.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {categories.map((category) => (
                              <CommandItem
                                key={category.id}
                                onSelect={() =>
                                  toggleCategorySelection(category.id)
                                }
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedCategories.includes(category.id)
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                {category.name}
                                {category.is_custom && (
                                  <Badge
                                    variant="secondary"
                                    className="ml-2 text-xs"
                                  >
                                    Custom
                                  </Badge>
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          <div className="border-t p-2">
                            <Button
                              variant="ghost"
                              className="w-full justify-start gap-2"
                              onClick={() => {
                                setCategoryPopoverOpen(false);
                                setNewCategoryDialogOpen(true);
                              }}
                            >
                              <Plus className="h-4 w-4" />
                              Add Custom Category
                            </Button>
                          </div>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {selectedCategories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedCategories.map((categoryId) => {
                          const category = categories.find(
                            (c) => c.id === categoryId,
                          );
                          return category ? (
                            <Badge
                              key={categoryId}
                              variant="secondary"
                              className="gap-1"
                            >
                              {category.name}
                              <X
                                className="w-3 h-3 cursor-pointer hover:text-destructive"
                                onClick={() =>
                                  toggleCategorySelection(categoryId)
                                }
                              />
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Version <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="e.g., 1.0.0 or v2.1"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Price Type <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={priceType}
                      onValueChange={(value) =>
                        setPriceType(value as "free" | "paid")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select price type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {priceType === "paid" && (
                    <div className="space-y-2">
                      <Label>
                        Price (MYR) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="number"
                        placeholder="e.g., 1000.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        min="0"
                        step="0.01"
                      />
                      {price && parseFloat(price) <= 0 && (
                        <p className="text-xs text-destructive">
                          Price must be greater than 0
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>
                      Live Link
                    </Label>
                    <Input
                      placeholder="https://your-model-demo.example.com"
                      value={liveLink}
                      onChange={(e) => setLiveLink(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Link to a live hosted version users can try out.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Detailed Description</Label>
                    <Textarea
                      placeholder="Markdown supported. Describe methodology, use cases, and limitations."
                      className="min-h-[150px]"
                      value={detailedDescription}
                      onChange={(e) => setDetailedDescription(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: TECHNICAL DETAILS */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-4">
                  <Label>Features (comma-separated)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., Real-time processing, Multi-language support, Cloud-based"
                      value={featuresInput}
                      onChange={(e) => setFeaturesInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddFeature();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleAddFeature}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add Features
                    </Button>
                  </div>
                  {features.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {features.map((feature, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="gap-1"
                        >
                          {feature}
                          <X
                            className="w-3 h-3 cursor-pointer hover:text-destructive"
                            onClick={() => handleRemoveFeature(index)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>
                      Response Time (ms){" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      placeholder="120"
                      value={responseTime}
                      onChange={(e) => setResponseTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Accuracy (%) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      placeholder="98.5"
                      value={accuracy}
                      onChange={(e) => setAccuracy(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>API Specification</Label>
                    <div className="flex gap-2">
                      <Select
                        value={apiSpecFormat}
                        onValueChange={setApiSpecFormat}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="yaml">YAML</SelectItem>
                          <SelectItem value="markdown">Markdown</SelectItem>
                          <SelectItem value="text">Plain Text</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant={apiSpecPreview ? "default" : "outline"}
                        size="sm"
                        onClick={() => setApiSpecPreview(!apiSpecPreview)}
                      >
                        {apiSpecPreview ? "Edit" : "Preview"}
                      </Button>
                    </div>
                  </div>

                  {!apiSpecPreview ? (
                    <Textarea
                      className="font-mono text-xs"
                      placeholder={
                        apiSpecFormat === "json"
                          ? '{\n  "endpoint": "/predict",\n  "method": "POST"\n}'
                          : "# API Documentation\n\nDescribe your API..."
                      }
                      rows={10}
                      value={apiSpec}
                      onChange={(e) => setApiSpec(e.target.value)}
                    />
                  ) : (
                    <div className="border rounded-lg p-4 bg-secondary/20 min-h-[240px]">
                      <ApiSpecRenderer
                        content={apiSpec}
                        format={
                          apiSpecFormat as "json" | "yaml" | "markdown" | "text"
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: FILES */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Files under 50MB can be uploaded directly. Use external URLs
                    for larger resources.
                  </AlertDescription>
                </Alert>

                {/* File Form */}
                <div className="border rounded-lg p-6 space-y-4 bg-secondary/10">
                  <h3 className="font-semibold text-lg">Add File</h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        File Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        placeholder="e.g., model_weights.h5"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>
                        File Type <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={fileType}
                        onValueChange={(val) =>
                          setFileType(val as "upload" | "url")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upload">
                            Upload File (&lt; 50MB)
                          </SelectItem>
                          <SelectItem value="url">
                            External URL (&gt; 50MB)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {fileType === "upload" ? (
                    <div className="space-y-2">
                      <input
                        type="file"
                        id="file-upload-edit"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedFile(file);
                            if (!fileName) {
                              setFileName(file.name);
                            }
                          }
                        }}
                      />
                      <label
                        htmlFor="file-upload-edit"
                        className={cn(
                          "border-2 border-dashed rounded-lg p-12 min-h-[200px] flex flex-col items-center justify-center text-center transition-all cursor-pointer",
                          isDragging
                            ? "border-primary/50 bg-primary/20 shadow-lg"
                            : "border-border hover:border-primary/30 hover:bg-secondary/30",
                        )}
                        onDragEnter={handleDragEnter}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <div className="pointer-events-none flex flex-col items-center">
                          <Upload
                            className={cn(
                              "w-12 h-12 mb-4 transition-all",
                              isDragging
                                ? "text-primary animate-bounce"
                                : "text-muted-foreground",
                            )}
                          />
                          <p
                            className={cn(
                              "text-base font-medium transition-colors mb-1",
                              isDragging ? "text-primary" : "text-foreground",
                            )}
                          >
                            {isDragging
                              ? "Drop file here..."
                              : selectedFile
                                ? selectedFile.name
                                : "Drag & drop or click to browse"}
                          </p>
                          {!selectedFile && !isDragging && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Maximum file size: 50MB
                            </p>
                          )}
                          {selectedFile && !isDragging && (
                            <p className="text-sm text-primary mt-2 font-medium">
                              {formatFileSize(selectedFile.size)}
                            </p>
                          )}
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>
                        External URL <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        placeholder="https://s3.amazonaws.com/..."
                        value={fileUrl}
                        onChange={(e) => setFileUrl(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Description (Optional)</Label>
                    <Textarea
                      placeholder="Brief description of this file"
                      rows={3}
                      value={fileDescription}
                      onChange={(e) => setFileDescription(e.target.value)}
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleAddFile}
                    className="w-full gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add File
                  </Button>
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">
                      Added Files ({files.length})
                    </h3>
                    <div className="space-y-2">
                      {files.map((file) => {
                        const isUrl = file.type === "url";
                        return (
                          <div
                            key={file.id}
                            className="flex items-start justify-between p-4 border rounded-lg bg-card hover:bg-secondary/20 transition-colors"
                          >
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <p className="font-medium">{file.name}</p>
                                <Badge variant="outline" className="text-xs">
                                  {file.type === "upload" ? "Upload" : "URL"}
                                </Badge>
                                {file.size && (
                                  <span className="text-xs text-muted-foreground">
                                    ({formatFileSize(file.size)})
                                  </span>
                                )}
                                {file.fileId && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Saved
                                  </Badge>
                                )}
                              </div>
                              {file.description && (
                                <p className="text-sm text-muted-foreground ml-6">
                                  {file.description}
                                </p>
                              )}
                              {isUrl && file.url && (
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline ml-6 truncate max-w-md block break-all"
                                >
                                  {file.url}
                                </a>
                              )}
                              {!isUrl && file.fileId && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="ml-6 gap-2"
                                  onClick={() => handleDownloadFile(file)}
                                  disabled={downloadingFileId === file.id}
                                >
                                  {downloadingFileId === file.id ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Downloading...
                                    </>
                                  ) : (
                                    <>
                                      <Download className="w-4 h-4" /> Download
                                    </>
                                  )}
                                </Button>
                              )}
                              {file.uploading &&
                                file.uploadProgress !== undefined && (
                                  <div className="ml-6">
                                    <Progress
                                      value={file.uploadProgress}
                                      className="h-2"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Uploading... {file.uploadProgress}%
                                    </p>
                                  </div>
                                )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveFile(file.id)}
                              className="text-destructive hover:text-destructive"
                              disabled={file.uploading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: COLLABORATORS */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid md:grid-cols-5 gap-6">
                  {/* Left: Collaborator List */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="bg-secondary/20 rounded-lg p-4">
                      <h4 className="font-medium text-sm mb-3">
                        Current Team ({collaborators.length + 1})
                      </h4>

                      {/* Current User */}
                      <div className="flex items-center gap-3 mb-3 pb-3 border-b">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                          {userProfile?.name
                            ? getInitials(userProfile.name)
                            : "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {userProfile?.name || "User"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {userProfile?.email || "user@example.com"}
                          </p>
                          <p className="text-xs text-primary">Owner</p>
                        </div>
                      </div>

                      {/* Collaborators */}
                      {collaborators.map((collab, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 mb-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-secondary text-foreground flex items-center justify-center text-xs font-bold shrink-0">
                            {getInitials(collab.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {collab.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {collab.email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {collab.role}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive shrink-0"
                            onClick={() =>
                              handleRemoveCollaborator(collab.email)
                            }
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}

                      {collaborators.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          No collaborators added yet
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Add Collaborator Forms */}
                  <div className="md:col-span-3 space-y-6">
                    {/* Add by Email */}
                    <div className="space-y-4 border rounded-lg p-4">
                      <h4 className="font-medium">Add by Email</h4>

                      <div className="space-y-2">
                        <Label>
                          Full Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          placeholder="John Doe"
                          value={collabName}
                          onChange={(e) => setCollabName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>
                          Email Address{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          type="email"
                          placeholder="collaborator@email.com"
                          value={collabEmail}
                          onChange={(e) => setCollabEmail(e.target.value)}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full gap-2"
                        onClick={handleAddCollaborator}
                      >
                        <Plus className="w-4 h-4" /> Add Collaborator
                      </Button>

                      <p className="text-xs text-muted-foreground">
                        Collaborators will have edit access to this model page.
                      </p>
                    </div>

                    {/* Add Existing Publisher */}
                    <div className="space-y-4 border rounded-lg p-4">
                      <h4 className="font-medium">Add Existing Publisher</h4>

                      <div className="space-y-2">
                        <Label>Select Publisher</Label>
                        <Select
                          value={selectedPublisher}
                          onValueChange={setSelectedPublisher}
                          disabled={loadingPublishers}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                loadingPublishers
                                  ? "Loading publishers..."
                                  : "Choose a publisher..."
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {publishers.map((pub) => (
                              <SelectItem key={pub.id} value={pub.id}>
                                {pub.name} - {pub.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full gap-2"
                        onClick={handleAddPublisher}
                        disabled={!selectedPublisher}
                      >
                        <Plus className="w-4 h-4" /> Add Publisher
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || isSubmitting}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex gap-2">
            {step !== 4 && (
              <Button
                onClick={handleNext}
                className="gap-2"
                variant="outline"
                disabled={isSubmitting}
              >
                Next Step
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              className="gap-2"
              disabled={!isAllRequiredFieldsComplete() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Model"
              )}
            </Button>
            {model?.status === "draft" && (
              <Button
                onClick={handlePublish}
                className="gap-2"
                disabled={!isAllRequiredFieldsComplete() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Publish Model
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Custom Category Dialog */}
        <Dialog
          open={newCategoryDialogOpen}
          onOpenChange={setNewCategoryDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Category</DialogTitle>
              <DialogDescription>
                Create a new category for your AI model. This category will be
                available for future models as well.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Category Name</Label>
                <Input
                  id="category-name"
                  placeholder="e.g., Robotics, Edge Computing"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateCustomCategory();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setNewCategoryDialogOpen(false);
                  setNewCategoryName("");
                }}
                disabled={creatingCategory}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCustomCategory}
                disabled={creatingCategory || !newCategoryName.trim()}
              >
                {creatingCategory ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Category"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* File Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete File?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{fileToDelete?.name}"? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete File
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
