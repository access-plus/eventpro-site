import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Upload, X, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { apiService } from "@/lib/api";
import { getEventImageUrl } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().min(1, "Country is required"),
});

const eventFormSchema = z.object({
  name: z.string().min(1, "Event name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  category: z.string().min(1, "Category is required"),
  marketingEnabled: z.boolean().default(false),
  address: addressSchema,
}).refine((data) => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  return end > start;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

type EventFormValues = z.infer<typeof eventFormSchema>;

const EventFormNew = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: "",
      description: "",
      startTime: "",
      endTime: "",
      category: "",
      marketingEnabled: false,
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      },
    },
  });

  // Load existing event data in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      loadEventData(id);
    }
  }, [id, isEditMode]);

  const loadEventData = async (eventId: string) => {
    try {
      setIsLoading(true);
      const event = await apiService.getEvent(eventId);

      // Format dates for datetime-local input
      const formatDateTime = (dateStr: string | undefined): string => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        if (Number.isNaN(date.getTime())) return "";
        return date.toISOString().slice(0, 16);
      };

      const startRaw = event.startTime ?? event.startDateTime;
      const endRaw = event.endTime ?? event.endDateTime;

      form.reset({
        name: event.name,
        description: event.description || "",
        startTime: formatDateTime(startRaw),
        endTime: formatDateTime(endRaw),
        category: event.categoryName || event.category || "",
        marketingEnabled: event.marketingEnabled || false,
        address: {
          street: event.addressStreet || "",
          city: event.addressCity || "",
          state: event.addressState || "",
          zipCode: event.addressZipCode || "",
          country: event.addressCountry || "",
        },
      });

      if (event.imageUrl) {
        const displayUrl = getEventImageUrl(event.imageUrl) ?? event.imageUrl;
        setExistingImageUrl(event.imageUrl);
        setImagePreview(displayUrl);
      }
    } catch (error: any) {
      console.error("Failed to load event:", error);
      toast.error("Failed to load event data");
      navigate("/organizer");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(existingImageUrl);
  };

  const onSubmit = async (values: EventFormValues) => {
    setIsSubmitting(true);

    try {
      // Format datetime as ISO string for Java LocalDateTime
      const formatLocalDateTime = (dateStr: string): string => {
        const date = new Date(dateStr);
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
      };

      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
      const token = localStorage.getItem("accessToken");

      if (isEditMode && id) {
        // UPDATE MODE - JSON PUT; upload image first if present, then update with URL
        let imageUrl: string | undefined;
        if (imageFile) {
          const upload = await apiService.uploadEventImage(imageFile);
          imageUrl = upload?.url;
        }
        const requestPayload = {
          name: values.name,
          description: values.description,
          startTime: formatLocalDateTime(values.startTime),
          endTime: formatLocalDateTime(values.endTime),
          category: values.category,
          marketingEnabled: values.marketingEnabled,
          address: values.address,
          ...(imageUrl && { imageUrl }),
        };
        await apiService.updateOrganizerEvent(id, requestPayload);
        toast.success("Event updated successfully!");
        navigate("/organizer");
      } else {
        // CREATE MODE - Use POST
        const formData = new FormData();

        const requestPayload = {
          name: values.name,
          description: values.description,
          startTime: formatLocalDateTime(values.startTime),
          endTime: formatLocalDateTime(values.endTime),
          category: values.category,
          marketingEnabled: values.marketingEnabled,
          address: values.address,
        };

        formData.append("request", JSON.stringify(requestPayload));

        if (imageFile) {
          formData.append("imageFile", imageFile);
        }

        const response = await axios.post(`${baseUrl}/api/v1/events`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (response.data.success) {
          const eventId = response.data.data.id;
          toast.success("Event created successfully! You can now add tickets.");
          // Navigate to tickets page to add tickets
          navigate(`/organizer/events/${eventId}/tickets`);
        }
      }
    } catch (error: any) {
      console.error("Failed to save event:", error);
      const message = error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} event`;
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 flex items-center justify-center">
        <p className="text-muted-foreground">Loading event...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link to="/organizer" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl">
                  {isEditMode ? "Edit Event" : "Create New Event"}
                </CardTitle>
              </div>
              {!isEditMode && (
                <p className="text-sm text-muted-foreground mt-2">
                  After creating your event, you'll be able to add tickets.
                </p>
              )}
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Image Upload */}
                  <div className="space-y-2">
                    <Label>Event Image</Label>
                    {imagePreview ? (
                      <div className="space-y-2">
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={removeImage}
                            title="Remove image"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="image-upload-edit" className="cursor-pointer">
                            <span className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                              <Upload className="h-4 w-4" />
                              {isEditMode ? "Update image" : "Change image"}
                            </span>
                          </Label>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            id="image-upload-edit"
                          />
                        </div>
                      </div>
                    ) : (
                      <label
                        htmlFor="image-upload"
                        className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer block"
                      >
                        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          id="image-upload"
                        />
                        <div className="text-sm text-muted-foreground hover:text-foreground">
                          Click to upload event image (Max 5MB)
                        </div>
                      </label>
                    )}
                  </div>

                  {/* Event Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter event name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your event"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Category */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Music">Music</SelectItem>
                            <SelectItem value="Afrobeat Concerts">Afrobeat Concerts</SelectItem>
                            <SelectItem value="Sports">Sports</SelectItem>
                            <SelectItem value="Conference">Conference</SelectItem>
                            <SelectItem value="Diaspora Film Screenings">Diaspora Film Screenings</SelectItem>
                            <SelectItem value="National Day Celebrations">National Day Celebrations</SelectItem>
                            <SelectItem value="Cultural Festival">Cultural Festival</SelectItem>
                            <SelectItem value="Comedy">Comedy</SelectItem>
                            <SelectItem value="Theater">Theater</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Date/Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date & Time</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date & Time</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Address Section */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Event Address</Label>

                    <FormField
                      control={form.control}
                      name="address.street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main Street" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="address.city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="City" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="address.state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input placeholder="State" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="address.zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Zip Code</FormLabel>
                            <FormControl>
                              <Input placeholder="12345" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="address.country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input placeholder="Country" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Marketing Enabled */}
                  <FormField
                    control={form.control}
                    name="marketingEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Enable Marketing
                          </FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Allow this event to be featured in marketing campaigns
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate("/organizer")}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting
                        ? (isEditMode ? "Updating..." : "Creating...")
                        : (isEditMode ? "Update Event" : "Create Event")}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default EventFormNew;