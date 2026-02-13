import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Check, Upload, FileText, Code, Users, X, Plus, Info, Trash2, Loader2, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { uploadFileWithProgress, saveExternalUrl, validateFile, formatFileSize } from "@/lib/file-upload";
import { createModel, insertCollaborators } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Progress } from "@/components/ui/progress";
import { ApiSpecRenderer } from "@/components/ApiSpecRenderer";
import { Category } from "@/lib/types";

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
  type: 'upload' | 'url';
  description?: string;
  file?: File;
  url?: string;
  size?: number;
  fileId?: string; // Database file ID
  uploading?: boolean;
  uploadProgress?: number;
}

// Helper function to get user initials
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export default function CreateModelPage() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, userProfile } = useAuth();

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
  const [fileType, setFileType] = useState<'upload' | 'url'>('upload');
  const [fileUrl, setFileUrl] = useState("");
  const [fileDescription, setFileDescription] = useState("");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Tab 4: Collaborators state
  const [collabEmail, setCollabEmail] = useState("");
  const [collabName, setCollabName] = useState("");
  const [selectedPublisher, setSelectedPublisher] = useState("");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  // Validation & UI state
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrorSummary, setShowErrorSummary] = useState(false);
  const [showBackDialog, setShowBackDialog] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Fetch publishers from database
  useEffect(() => {
    const fetchPublishers = async () => {
      if (!user?.id) return;

      try {
        setLoadingPublishers(true);

        // Query for all users with publisher role, excluding current user
        const { data, error } = await supabase
          .from('user_roles')
          .select(`
            user_id,
            users!inner (
              id,
              name,
              email
            ),
            roles!inner (
              role_name
            )
          `)
          .eq('roles.role_name', 'publisher')
          .neq('user_id', user.id);

        if (error) {
          console.error('Error fetching publishers:', error);
          toast({
            title: "Error loading publishers",
            description: "Could not load publisher list. Please try again.",
            variant: "destructive",
          });
          return;
        }

        // Transform data to Publisher format
        const publisherList: Publisher[] = data
          .map((item: any) => ({
            id: item.users.id,
            name: item.users.name,
            email: item.users.email,
          }))
          .filter((pub, index, self) =>
            // Remove duplicates based on id
            index === self.findIndex((p) => p.id === pub.id)
          );

        setPublishers(publisherList);
      } catch (error) {
        console.error('Error in fetchPublishers:', error);
      } finally {
        setLoadingPublishers(false);
      }
    };

    fetchPublishers();
  }, [user?.id, toast]);

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);

        const { data, error } = await supabase
          .from('categories')
          .select('id, name, is_custom')
          .order('is_custom', { ascending: true })
          .order('name', { ascending: true });

        if (error) {
          console.error('Error fetching categories:', error);
          toast({
            title: "Error loading categories",
            description: "Could not load category list. Please try again.",
            variant: "destructive",
          });
          return;
        }

        setCategories(data || []);
      } catch (error) {
        console.error('Error in fetchCategories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [toast]);

  // Validation for Tab 1: General Info
  const isTab1Complete = () => {
    const basicValidation = (
      modelName.trim().length > 0 &&
      modelName.length <= 25 &&
      shortDescription.trim().length > 0 &&
      shortDescription.length <= 700 &&
      selectedCategories.length > 0 &&
      version.trim().length > 0 &&
      priceType !== ""
    );

    // If paid, price must be filled and greater than 0
    if (priceType === "paid") {
      return basicValidation && price.trim().length > 0 && parseFloat(price) > 0;
    }

    return basicValidation;
  };

  // Validation for Tab 2: Technical Details - Response Time and Accuracy are required
  const isTab2Complete = () => {
    return (
      responseTime.trim().length > 0 &&
      accuracy.trim().length > 0
    );
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
      case 1: return isTab1Complete();
      case 2: return isTab2Complete();
      case 3: return isTab3Complete();
      case 4: return isTab4Complete();
      default: return false;
    }
  };

  // Check if all required fields across all tabs are complete
  const isAllRequiredFieldsComplete = () => {
    return isTab1Complete() && isTab2Complete() && isTab3Complete();
  };

  // Field-level validation errors
  const getFieldError = (fieldName: string): string | null => {
    if (!touched[fieldName]) return null;

    switch (fieldName) {
      case 'modelName':
        if (!modelName.trim()) return "Model name is required";
        if (modelName.length > 25) return "Model name must be 25 characters or less";
        return null;
      case 'shortDescription':
        if (!shortDescription.trim()) return "Short description is required";
        if (shortDescription.length > 700) return "Description must be 700 characters or less";
        return null;
      case 'categories':
        if (selectedCategories.length === 0) return "At least one category is required";
        return null;
      case 'version':
        if (!version.trim()) return "Version is required";
        return null;
      case 'priceType':
        if (!priceType) return "Price type is required";
        return null;
      case 'price':
        if (priceType === 'paid') {
          if (!price.trim()) return "Price is required for paid models";
          if (parseFloat(price) <= 0) return "Price must be greater than 0";
        }
        return null;
      case 'responseTime':
        if (!responseTime.trim()) return "Response time is required";
        if (parseFloat(responseTime) <= 0) return "Response time must be a positive number";
        return null;
      case 'accuracy':
        if (!accuracy.trim()) return "Accuracy is required";
        const accNum = parseFloat(accuracy);
        if (isNaN(accNum) || accNum < 0 || accNum > 100) return "Accuracy must be between 0 and 100";
        return null;
      default:
        return null;
    }
  };

  const markFieldTouched = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  // Check if user has started filling any required fields
  const hasUnsavedChanges = () => {
    return (
      modelName.trim().length > 0 ||
      shortDescription.trim().length > 0 ||
      selectedCategories.length > 0 ||
      version.trim().length > 0 ||
      priceType !== "" ||
      responseTime.trim().length > 0 ||
      accuracy.trim().length > 0 ||
      files.length > 0
    );
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      // On first step, check if there are unsaved changes
      if (hasUnsavedChanges()) {
        setShowBackDialog(true);
      } else {
        setLocation("/publisher/my-models");
      }
    }
  };

  const handleDiscardChanges = () => {
    setShowBackDialog(false);
    setLocation("/publisher/my-models");
  };

  const handleSaveAsDraft = async () => {
    setShowBackDialog(false);
    setIsSavingDraft(true);
    await handleSubmit('draft');
    setIsSavingDraft(false);
  };

  const handleSubmit = async (statusOverride?: 'draft' | 'published') => {
    // Mark all fields as touched to show validation errors
    setTouched({
      modelName: true,
      shortDescription: true,
      categories: true,
      version: true,
      priceType: true,
      price: true,
      responseTime: true,
      accuracy: true,
    });

    if (!isAllRequiredFieldsComplete()) {
      const missingFields = [];
      if (!isTab1Complete()) missingFields.push("General Info");
      if (!isTab2Complete()) missingFields.push("Technical Details");
      if (!isTab3Complete()) missingFields.push("Files & Assets");

      setShowErrorSummary(true);
      toast({
        title: "Validation Error",
        description: `Please fix ${missingFields.length} error${missingFields.length > 1 ? 's' : ''} to continue`,
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a model.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setShowErrorSummary(false);

    try {
      // Step 1: Create the model
      const modelData = {
        name: modelName,
        shortDescription: shortDescription,
        detailedDescription: detailedDescription,
        version: version,
        features: features,
        responseTime: parseFloat(responseTime),
        accuracy: parseFloat(accuracy),
        apiDocumentation: apiSpec || null,
        apiSpecFormat: apiSpecFormat,
        publisherId: user.id,
        status: statusOverride || 'published', // Default to 'published', unless saving as draft
        subscriptionType: priceType,
        priceAmount: priceType === 'paid' ? parseFloat(price) : null,
      };

      const createdModel = await createModel(modelData);

      // Step 2: Save categories to junction table
      if (selectedCategories.length > 0) {
        const categoryInserts = selectedCategories.map(categoryId => ({
          model_id: createdModel.id,
          category_id: categoryId,
        }));

        const { error: categoryError } = await supabase
          .from('model_categories')
          .insert(categoryInserts);

        if (categoryError) {
          console.error('Error saving categories:', categoryError);
          toast({
            title: "Warning",
            description: "Model created but categories could not be saved.",
            variant: "destructive",
          });
        }
      }

      // Step 2.5: Save collaborators to database
      if (collaborators.length > 0) {
        try {
          await insertCollaborators(createdModel.id, collaborators.map(c => ({
            name: c.name,
            email: c.email
          })));
        } catch (collabError: any) {
          console.error('Error saving collaborators:', collabError);
          toast({
            title: "Warning",
            description: "Model created but collaborators could not be saved.",
            variant: "destructive",
          });
        }
      }

      // Step 3: Upload files
      for (let i = 0; i < files.length; i++) {
        const fileEntry = files[i];

        if (fileEntry.type === 'upload' && fileEntry.file) {
          // Upload file to storage
          await uploadFileWithProgress(
            fileEntry.file,
            user.id,
            createdModel.id,
            fileEntry.description,
            (progress) => {
              // Update progress for this file
              setFiles(prev => prev.map((f, idx) =>
                idx === i ? { ...f, uploadProgress: progress, uploading: true } : f
              ));
            }
          );

          // Mark as complete
          setFiles(prev => prev.map((f, idx) =>
            idx === i ? { ...f, uploading: false, uploadProgress: 100 } : f
          ));
        } else if (fileEntry.type === 'url' && fileEntry.url) {
          // Save external URL
          await saveExternalUrl(
            createdModel.id,
            fileEntry.name,
            fileEntry.url,
            fileEntry.description
          );
        }
      }

      const statusMessage = statusOverride === 'draft' ? 'saved as draft' : 'published successfully';
      toast({
        title: `Model ${statusOverride === 'draft' ? 'Saved as Draft' : 'Published Successfully'}`,
        description: `${modelName} has been ${statusMessage} with ${files.length} file${files.length !== 1 ? 's' : ''}.`,
      });
      setLocation("/publisher/my-models");
    } catch (error: any) {
      console.error('Error creating model:', error);
      toast({
        title: "Error Creating Model",
        description: error.message || "An unexpected error occurred.",
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
        .split(',')
        .map(f => f.trim())
        .filter(f => f.length > 0);
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

    if (fileType === 'upload') {
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
    } else if (fileType === 'url' && !fileUrl.trim()) {
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
      url: fileType === 'url' ? fileUrl : undefined,
      file: fileType === 'upload' ? selectedFile! : undefined,
      size: fileType === 'upload' ? selectedFile!.size : undefined,
    };

    setFiles([...files, newFile]);

    // Clear form
    setFileName("");
    setFileUrl("");
    setFileDescription("");
    setSelectedFile(null);
  };

  const handleRemoveFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
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
    if (collaborators.some(c => c.email === collabEmail)) {
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
      role: 'Collaborator',
    };

    setCollaborators([...collaborators, newCollab]);

    // Clear form
    setCollabEmail("");
    setCollabName("");
  };

  // Tab 4: Add existing publisher handler
  const handleAddPublisher = () => {
    if (!selectedPublisher) return;

    const publisher = publishers.find(p => p.id === selectedPublisher);
    if (!publisher) return;

    // Check if already added
    if (collaborators.some(c => c.email === publisher.email)) {
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
      role: 'Publisher',
    };

    setCollaborators([...collaborators, newCollab]);
    setSelectedPublisher("");
  };

  const handleRemoveCollaborator = (email: string) => {
    setCollaborators(collaborators.filter(c => c.email !== email));
  };

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
    if (categories.some(cat => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
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
        .from('categories')
        .insert({
          name: newCategoryName.trim(),
          is_custom: true,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating category:', error);
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
      console.error('Error in handleCreateCustomCategory:', error);
    } finally {
      setCreatingCategory(false);
    }
  };

  // Toggle category selection
  const toggleCategorySelection = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <Layout type="dashboard">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => {
            if (hasUnsavedChanges()) {
              setShowBackDialog(true);
            } else {
              setLocation("/publisher/my-models");
            }
          }}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
             <h1 className="text-3xl font-heading font-bold">Create New Model</h1>
             <p className="text-muted-foreground">Follow the steps to publish your AI model.</p>
          </div>
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
                        : "border-muted-foreground/30 bg-background text-muted-foreground"
                    )}
                  >
                    {isComplete ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                  </div>
                  <span className={cn(
                    "text-xs font-medium",
                    isComplete || isCurrent || isTab4WithCollaborators ? "text-primary" : "text-muted-foreground"
                  )}>
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Summary */}
        {showErrorSummary && !isAllRequiredFieldsComplete() && (
          <Alert variant="destructive" className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Please fix the following errors to continue:
              <ul className="list-disc list-inside mt-2 space-y-1">
                {!isTab1Complete() && <li>Complete General Info (name, description, category, version, price type)</li>}
                {!isTab2Complete() && <li>Complete Technical Details (response time and accuracy)</li>}
                {!isTab3Complete() && <li>Add at least one file</li>}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Wizard Content */}
        <Card className="min-h-[400px] border-border/50 shadow-md">
           <CardContent className="p-8">
              {/* TAB 1: GENERAL INFO */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                   <div className="grid gap-4">
                      <div className="space-y-2">
                         <Label>Model Name <span className="text-destructive">*</span></Label>
                         <Input
                           placeholder="e.g. Traffic Pattern Analyzer Pro"
                           value={modelName}
                           onChange={(e) => {
                             setModelName(e.target.value.slice(0, 25));
                             if (touched.modelName) markFieldTouched('modelName');
                           }}
                           onBlur={() => markFieldTouched('modelName')}
                           maxLength={25}
                           className={cn(getFieldError('modelName') && "border-destructive")}
                         />
                         {getFieldError('modelName') && (
                           <p className="text-xs text-destructive">{getFieldError('modelName')}</p>
                         )}
                         <p className={cn(
                           "text-xs",
                           modelName.length > 20 ? "text-destructive" : "text-muted-foreground"
                         )}>
                           {modelName.length} / 25 characters
                         </p>
                      </div>

                      <div className="space-y-2">
                         <Label>Short Description <span className="text-destructive">*</span></Label>
                         <Input
                           placeholder="Brief summary of what your model does"
                           value={shortDescription}
                           onChange={(e) => setShortDescription(e.target.value.slice(0, 700))}
                           maxLength={700}
                         />
                         <p className={cn(
                           "text-xs",
                           shortDescription.length > 650 ? "text-destructive" : "text-muted-foreground"
                         )}>
                           {shortDescription.length} / 700 characters
                         </p>
                      </div>

                      <div className="space-y-2">
                         <Label>Categories <span className="text-destructive">*</span></Label>
                         <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                           <PopoverTrigger asChild>
                             <Button
                               variant="outline"
                               role="combobox"
                               aria-expanded={categoryPopoverOpen}
                               className="w-full justify-between"
                               disabled={loadingCategories}
                             >
                               {loadingCategories ? (
                                 "Loading categories..."
                               ) : selectedCategories.length > 0 ? (
                                 `${selectedCategories.length} selected`
                               ) : (
                                 "Select categories..."
                               )}
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
                                     onSelect={() => toggleCategorySelection(category.id)}
                                   >
                                     <Check
                                       className={cn(
                                         "mr-2 h-4 w-4",
                                         selectedCategories.includes(category.id)
                                           ? "opacity-100"
                                           : "opacity-0"
                                       )}
                                     />
                                     {category.name}
                                     {category.is_custom && (
                                       <Badge variant="secondary" className="ml-2 text-xs">
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
                         {getFieldError('categories') && (
                           <p className="text-xs text-destructive">{getFieldError('categories')}</p>
                         )}
                         {selectedCategories.length > 0 && (
                           <div className="flex flex-wrap gap-2 mt-2">
                             {selectedCategories.map((categoryId) => {
                               const category = categories.find(c => c.id === categoryId);
                               return category ? (
                                 <Badge key={categoryId} variant="secondary" className="gap-1">
                                   {category.name}
                                   <X
                                     className="w-3 h-3 cursor-pointer hover:text-destructive"
                                     onClick={() => toggleCategorySelection(categoryId)}
                                   />
                                 </Badge>
                               ) : null;
                             })}
                           </div>
                         )}
                      </div>

                      <div className="space-y-2">
                         <Label>Version <span className="text-destructive">*</span></Label>
                         <Input
                           placeholder="e.g., 1.0.0 or v2.1"
                           value={version}
                           onChange={(e) => setVersion(e.target.value)}
                         />
                      </div>

                      <div className="space-y-2">
                         <Label>Price Type <span className="text-destructive">*</span></Label>
                         <Select value={priceType} onValueChange={(value) => setPriceType(value as "free" | "paid")}>
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
                           <Label>Price (MYR / Month) <span className="text-destructive">*</span></Label>
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
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddFeature();
                              }
                            }}
                          />
                          <Button type="button" variant="secondary" onClick={handleAddFeature} className="gap-2">
                            <Plus className="w-4 h-4" /> Add Features
                          </Button>
                       </div>
                       {features.length > 0 && (
                         <div className="flex flex-wrap gap-2 mt-2">
                           {features.map((feature, index) => (
                             <Badge key={index} variant="secondary" className="gap-1">
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
                          <Label>Response Time (ms) <span className="text-destructive">*</span></Label>
                          <Input
                            type="number"
                            placeholder="120"
                            value={responseTime}
                            onChange={(e) => setResponseTime(e.target.value)}
                          />
                       </div>
                       <div className="space-y-2">
                          <Label>Accuracy (%) <span className="text-destructive">*</span></Label>
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
                            <Select value={apiSpecFormat} onValueChange={setApiSpecFormat}>
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
                            placeholder={apiSpecFormat === 'json' ? '{\n  "endpoint": "/predict",\n  "method": "POST"\n}' : '# API Documentation\n\nDescribe your API...'}
                            rows={10}
                            value={apiSpec}
                            onChange={(e) => setApiSpec(e.target.value)}
                          />
                        ) : (
                          <div className="border rounded-lg p-4 bg-secondary/20 min-h-[240px]">
                            <ApiSpecRenderer
                              content={apiSpec}
                              format={apiSpecFormat as "json" | "yaml" | "markdown" | "text"}
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
                        Files under 50MB can be uploaded directly. Use external URLs for larger resources.
                      </AlertDescription>
                    </Alert>

                    {/* File Form */}
                    <div className="border rounded-lg p-6 space-y-4 bg-secondary/10">
                      <h3 className="font-semibold text-lg">Add File</h3>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>File Name <span className="text-destructive">*</span></Label>
                          <Input
                            placeholder="e.g., model_weights.h5"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>File Type <span className="text-destructive">*</span></Label>
                          <Select value={fileType} onValueChange={(val) => setFileType(val as 'upload' | 'url')}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="upload">Upload File (&lt; 50MB)</SelectItem>
                              <SelectItem value="url">External URL (&gt; 50MB)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {fileType === 'upload' ? (
                        <div className="space-y-2">
                          <input
                            type="file"
                            id="file-upload"
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
                            htmlFor="file-upload"
                            className={cn(
                              "border-2 border-dashed rounded-lg p-12 min-h-[200px] flex flex-col items-center justify-center text-center transition-all cursor-pointer",
                              isDragging
                                ? "border-primary/50 bg-primary/20 shadow-lg"
                                : "border-border hover:border-primary/30 hover:bg-secondary/30"
                            )}
                            onDragEnter={handleDragEnter}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                          >
                            <div className="pointer-events-none flex flex-col items-center">
                              <Upload className={cn(
                                "w-12 h-12 mb-4 transition-all",
                                isDragging ? "text-primary animate-bounce" : "text-muted-foreground"
                              )} />
                              <p className={cn(
                                "text-base font-medium transition-colors mb-1",
                                isDragging ? "text-primary" : "text-foreground"
                              )}>
                                {isDragging
                                  ? "Drop file here..."
                                  : selectedFile
                                  ? selectedFile.name
                                  : "Drag & drop or click to browse"
                                }
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
                          <Label>External URL <span className="text-destructive">*</span></Label>
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

                      <Button type="button" onClick={handleAddFile} className="w-full gap-2">
                        <Plus className="w-4 h-4" /> {fileType === 'url' ? 'Add URL' : 'Add File'}
                      </Button>
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-semibold">Added Files ({files.length})</h3>
                        <div className="space-y-2">
                          {files.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-start justify-between p-4 border rounded-lg bg-card hover:bg-secondary/20 transition-colors"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-muted-foreground" />
                                  <p className="font-medium">{file.name}</p>
                                  <Badge variant="outline" className="text-xs">
                                    {file.type === 'upload' ? 'Upload' : 'URL'}
                                  </Badge>
                                  {file.size && (
                                    <span className="text-xs text-muted-foreground">
                                      ({formatFileSize(file.size)})
                                    </span>
                                  )}
                                </div>
                                {file.description && (
                                  <p className="text-sm text-muted-foreground mt-1 ml-6">
                                    {file.description}
                                  </p>
                                )}
                                {file.url && (
                                  <p className="text-xs text-blue-600 mt-1 ml-6 truncate max-w-md">
                                    {file.url}
                                  </p>
                                )}
                                {file.uploading && file.uploadProgress !== undefined && (
                                  <div className="mt-2 ml-6">
                                    <Progress value={file.uploadProgress} className="h-2" />
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
                          ))}
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
                          <h4 className="font-medium text-sm mb-3">Current Team ({collaborators.length + 1})</h4>

                          {/* Current User */}
                          <div className="flex items-center gap-3 mb-3 pb-3 border-b">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                              {userProfile?.name ? getInitials(userProfile.name) : 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{userProfile?.name || 'User'}</p>
                              <p className="text-xs text-muted-foreground truncate">{userProfile?.email || 'user@example.com'}</p>
                              <p className="text-xs text-primary">Owner</p>
                            </div>
                          </div>

                          {/* Collaborators */}
                          {collaborators.map((collab, index) => (
                            <div key={index} className="flex items-center gap-3 mb-3">
                              <div className="w-8 h-8 rounded-full bg-secondary text-foreground flex items-center justify-center text-xs font-bold shrink-0">
                                {getInitials(collab.name)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {collab.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">{collab.email}</p>
                                <p className="text-xs text-muted-foreground">{collab.role}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:text-destructive shrink-0"
                                onClick={() => handleRemoveCollaborator(collab.email)}
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
                            <Label>Full Name <span className="text-destructive">*</span></Label>
                            <Input
                              placeholder="John Doe"
                              value={collabName}
                              onChange={(e) => setCollabName(e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Email Address <span className="text-destructive">*</span></Label>
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
                              disabled={loadingPublishers || publishers.length === 0}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    loadingPublishers
                                      ? "Loading publishers..."
                                      : publishers.length === 0
                                      ? "No other publishers found"
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
                            {!loadingPublishers && publishers.length === 0 && (
                              <p className="text-xs text-muted-foreground">
                                You are the only publisher in the system.
                              </p>
                            )}
                          </div>

                          <Button
                            type="button"
                            variant="secondary"
                            className="w-full gap-2"
                            onClick={handleAddPublisher}
                            disabled={!selectedPublisher || loadingPublishers || publishers.length === 0}
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
           <Button variant="outline" onClick={handleBack} disabled={step === 1 || isSubmitting}>
              Back
           </Button>
           <Button
             onClick={handleNext}
             className="gap-2"
             disabled={(step === 4 && !isAllRequiredFieldsComplete()) || isSubmitting}
           >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  {step === 4 ? "Create Model" : "Next Step"}
                  {step !== 4 && <ArrowRight className="w-4 h-4" />}
                </>
              )}
           </Button>
        </div>

        {/* Custom Category Dialog */}
        <Dialog open={newCategoryDialogOpen} onOpenChange={setNewCategoryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Category</DialogTitle>
              <DialogDescription>
                Create a new category for your AI model. This category will be available for future models as well.
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
                    if (e.key === 'Enter') {
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

        {/* Back Button Confirmation Dialog */}
        <Dialog open={showBackDialog} onOpenChange={setShowBackDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save your progress?</DialogTitle>
              <DialogDescription>
                You have unsaved changes. Would you like to save this model as a draft before leaving?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={handleDiscardChanges}
                disabled={isSavingDraft}
              >
                Don't Save
              </Button>
              <Button
                onClick={handleSaveAsDraft}
                disabled={isSavingDraft}
              >
                {isSavingDraft ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save as Draft"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </Layout>
  );
}
