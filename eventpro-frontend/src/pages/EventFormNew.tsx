import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Calendar, Upload, X, ArrowLeft, Grid3X3, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/lib/api";
import { getEventImageUrl } from "@/lib/utils";
import type { SeatResponse } from "@/types/api";
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
  promotionalVideoUrl: z.string().max(500).optional(),
  eventPageTemplate: z.enum(["DEFAULT", "MINIMAL", "VIBRANT"]).default("DEFAULT"),
  donationsEnabled: z.boolean().default(false),
  customDomain: z.string().max(255).optional(),
  reservedSeatingEnabled: z.boolean().default(false),
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

function canUseAddons(tier: string | undefined): boolean {
  const t = (tier ?? "BASIC").toUpperCase();
  return t === "PRO" || t === "ENTERPRISE";
}

const MAX_EVENT_IMAGES = 5;
const MAX_FILE_SIZE_MB = 5;

const EventFormNew = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isEditMode = Boolean(id);
  const showProFeatures = canUseAddons(user?.subscriptionTier);

  const [imageFiles, setImageFiles] = useState<{ file: File; preview: string }[]>([]);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [eventSeats, setEventSeats] = useState<SeatResponse[]>([]);
  const [isSeatMapSubmitting, setIsSeatMapSubmitting] = useState(false);
  const [seatMapSections, setSeatMapSections] = useState<Array<{ name: string; rowCount: number; seatsPerRow: number; price: number }>>([
    { name: "", rowCount: 1, seatsPerRow: 1, price: 0 },
  ]);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: "",
      description: "",
      startTime: "",
      endTime: "",
      category: "",
      marketingEnabled: false,
      promotionalVideoUrl: "",
      eventPageTemplate: "DEFAULT",
      donationsEnabled: false,
      customDomain: "",
      reservedSeatingEnabled: false,
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
        promotionalVideoUrl: event.promotionalVideoUrl || "",
        eventPageTemplate: (event.eventPageTemplate as "DEFAULT" | "MINIMAL" | "VIBRANT") || "DEFAULT",
        donationsEnabled: event.donationsEnabled || false,
        customDomain: event.customDomain || "",
        reservedSeatingEnabled: event.reservedSeatingEnabled || false,
        address: {
          street: event.addressStreet || "",
          city: event.addressCity || "",
          state: event.addressState || "",
          zipCode: event.addressZipCode || "",
          country: event.addressCountry || "",
        },
      });

      if (event.imageUrl) {
        setExistingImageUrl(event.imageUrl);
      }
      if (event.additionalImageUrls?.length) {
        setExistingGalleryUrls(event.additionalImageUrls.map((u: string) => getEventImageUrl(u) ?? u));
      }
      if (event.reservedSeatingEnabled) {
        const seats = await apiService.getEventSeats(eventId);
        setEventSeats(seats);
      } else {
        setEventSeats([]);
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
    const files = e.target.files;
    if (!files?.length) return;
    const currentCount = imageFiles.length + (existingImageUrl ? 1 : 0) + existingGalleryUrls.length;
    const remaining = MAX_EVENT_IMAGES - currentCount;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_EVENT_IMAGES} images allowed.`);
      return;
    }
    const toAdd: { file: File; preview: string }[] = [];
    const maxSize = MAX_FILE_SIZE_MB * 1024 * 1024;
    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const file = files[i];
      if (file.size > maxSize) {
        toast.error(`"${file.name}" must be less than ${MAX_FILE_SIZE_MB}MB`);
        continue;
      }
      toAdd.push({ file, preview: URL.createObjectURL(file) });
    }
    setImageFiles((prev) => [...prev, ...toAdd].slice(0, MAX_EVENT_IMAGES));
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(prev[index]?.preview ?? "");
      return next;
    });
  };

  const removeExistingImage = () => {
    setExistingImageUrl(null);
  };
  const removeExistingGallery = (index: number) => {
    setExistingGalleryUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const totalImageCount = imageFiles.length + (existingImageUrl ? 1 : 0) + existingGalleryUrls.length;
  const imagePreview = imageFiles[0]?.preview ?? existingImageUrl ? (getEventImageUrl(existingImageUrl) ?? existingImageUrl) : null;
  const hasAnyImage = imageFiles.length > 0 || existingImageUrl || existingGalleryUrls.length > 0;

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
        // UPDATE MODE - JSON PUT; upload first new image if present as new cover, then update with URL
        let imageUrl: string | undefined;
        if (imageFiles.length > 0) {
          const upload = await apiService.uploadEventImage(imageFiles[0].file);
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
          ...(values.promotionalVideoUrl?.trim() && { promotionalVideoUrl: values.promotionalVideoUrl.trim() }),
          ...(values.eventPageTemplate && { eventPageTemplate: values.eventPageTemplate }),
          donationsEnabled: values.donationsEnabled,
          ...(values.customDomain?.trim() && { customDomain: values.customDomain.trim() }),
          reservedSeatingEnabled: values.reservedSeatingEnabled,
          ...(imageUrl && { imageUrl }),
        };
        await apiService.updateOrganizerEvent(id, requestPayload);
        // Add any extra new images as gallery (first was used as new cover if present)
        for (let i = 1; i < imageFiles.length; i++) {
          const { url } = await apiService.uploadEventImage(imageFiles[i].file);
          await apiService.addEventImage(id, { imageUrl: url, displayOrder: i });
        }
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
          ...(values.promotionalVideoUrl?.trim() && { promotionalVideoUrl: values.promotionalVideoUrl.trim() }),
          ...(values.eventPageTemplate && { eventPageTemplate: values.eventPageTemplate }),
          donationsEnabled: values.donationsEnabled,
          ...(values.customDomain?.trim() && { customDomain: values.customDomain.trim() }),
          reservedSeatingEnabled: values.reservedSeatingEnabled,
        };

        formData.append("request", JSON.stringify(requestPayload));

        imageFiles.forEach(({ file }) => {
          formData.append("imageFiles", file);
        });

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
                  {/* Image Upload - up to 5 images (1 cover + 4 gallery) */}
                  <div className="space-y-2">
                    <Label>Event Images</Label>
                    <p className="text-sm text-muted-foreground">Add up to {MAX_EVENT_IMAGES} images. First image is the cover.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {existingImageUrl && (
                        <div className="relative aspect-video rounded-lg overflow-hidden border">
                          <img
                            src={getEventImageUrl(existingImageUrl) ?? existingImageUrl}
                            alt="Cover"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1 left-1 text-xs bg-black/70 text-white px-1.5 py-0.5 rounded">Cover</span>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-7 w-7"
                            onClick={removeExistingImage}
                            title="Remove cover"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                      {existingGalleryUrls.map((url, idx) => (
                        <div key={`existing-${idx}`} className="relative aspect-video rounded-lg overflow-hidden border">
                          <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-7 w-7"
                            onClick={() => removeExistingGallery(idx)}
                            title="Remove image"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                      {imageFiles.map((item, index) => (
                        <div key={item.preview} className="relative aspect-video rounded-lg overflow-hidden border">
                          <img src={item.preview} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                          <span className="absolute bottom-1 left-1 text-xs bg-black/70 text-white px-1.5 py-0.5 rounded">
                            {index === 0 && !existingImageUrl ? "Cover" : `Image ${index + 1}`}
                          </span>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-7 w-7"
                            onClick={() => removeImage(index)}
                            title="Remove image"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                      {totalImageCount < MAX_EVENT_IMAGES && (
                        <label
                          htmlFor="image-upload"
                          className="aspect-video rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                        >
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            className="hidden"
                            id="image-upload"
                          />
                          <span className="text-sm text-muted-foreground text-center px-2">
                            Add image ({totalImageCount}/{MAX_EVENT_IMAGES})
                          </span>
                        </label>
                      )}
                    </div>
                    {!hasAnyImage && (
                      <p className="text-xs text-muted-foreground">Max {MAX_FILE_SIZE_MB}MB per image.</p>
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

                  {/* Promotional video URL (YouTube/Vimeo) — Basic theming, all tiers */}
                  <FormField
                    control={form.control}
                    name="promotionalVideoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Promotional video (optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Event page template */}
                  <FormField
                    control={form.control}
                    name="eventPageTemplate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event page style</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose style" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="DEFAULT">Default</SelectItem>
                            <SelectItem value="MINIMAL">Minimal</SelectItem>
                            <SelectItem value="VIBRANT">Vibrant</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Donations & custom domain (Pro/Enterprise) */}
                  {showProFeatures && (
                    <>
                      <FormField
                        control={form.control}
                        name="donationsEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Accept donations at checkout</FormLabel>
                              <p className="text-sm text-muted-foreground">Let attendees add an optional donation</p>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="customDomain"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Custom domain (optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="tickets.yourvenue.org"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="reservedSeatingEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Reserved seating</FormLabel>
                              <p className="text-sm text-muted-foreground">Sell by specific seat (section, row, number). After saving, create a seat map below.</p>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </>
                  )}

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

                  {/* Seat map (edit only, Pro/Enterprise, when reserved seating enabled) */}
                  {isEditMode && id && showProFeatures && form.watch("reservedSeatingEnabled") && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Grid3X3 className="h-5 w-5" />
                          Seat map
                        </CardTitle>
                        <CardDescription>
                          {eventSeats.length > 0
                            ? `${eventSeats.length} seats created. Attendees can select specific seats on the event page.`
                            : "Define sections (e.g. Orchestra, Balcony). Save the event first, then add sections and create the seat map."}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {eventSeats.length > 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Seat map is set up. View the event page to see the seating chart.
                          </p>
                        ) : (
                          <>
                            <div className="space-y-3">
                              {seatMapSections.map((section, idx) => (
                                <div key={idx} className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
                                  <Input
                                    placeholder="Section name (e.g. Orchestra)"
                                    value={section.name}
                                    onChange={(e) =>
                                      setSeatMapSections((prev) =>
                                        prev.map((s, i) => (i === idx ? { ...s, name: e.target.value } : s))
                                      )
                                    }
                                    className="max-w-[180px]"
                                  />
                                  <div className="flex items-center gap-1">
                                    <Label className="text-xs whitespace-nowrap">Rows</Label>
                                    <Input
                                      type="number"
                                      min={1}
                                      value={section.rowCount}
                                      onChange={(e) =>
                                        setSeatMapSections((prev) =>
                                          prev.map((s, i) => (i === idx ? { ...s, rowCount: Math.max(1, parseInt(e.target.value, 10) || 1) } : s))
                                        )
                                      }
                                      className="w-16"
                                    />
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Label className="text-xs whitespace-nowrap">Seats/row</Label>
                                    <Input
                                      type="number"
                                      min={1}
                                      value={section.seatsPerRow}
                                      onChange={(e) =>
                                        setSeatMapSections((prev) =>
                                          prev.map((s, i) => (i === idx ? { ...s, seatsPerRow: Math.max(1, parseInt(e.target.value, 10) || 1) } : s))
                                        )
                                      }
                                      className="w-16"
                                    />
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Label className="text-xs whitespace-nowrap">Price $</Label>
                                    <Input
                                      type="number"
                                      min={0}
                                      step={0.01}
                                      value={section.price}
                                      onChange={(e) =>
                                        setSeatMapSections((prev) =>
                                          prev.map((s, i) => (i === idx ? { ...s, price: parseFloat(e.target.value) || 0 } : s))
                                        )
                                      }
                                      className="w-20"
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSeatMapSections((prev) => prev.filter((_, i) => i !== idx))}
                                    disabled={seatMapSections.length <= 1}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                setSeatMapSections((prev) => [...prev, { name: "", rowCount: 1, seatsPerRow: 1, price: 0 }])
                              }
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add section
                            </Button>
                            <Button
                              type="button"
                              className="bg-gradient-primary"
                              disabled={
                                isSeatMapSubmitting ||
                                seatMapSections.some((s) => !s.name?.trim() || s.price < 0)
                              }
                              onClick={async () => {
                                if (!id) return;
                                const sections = seatMapSections
                                  .filter((s) => s.name?.trim())
                                  .map((s) => ({ name: s.name.trim(), rowCount: s.rowCount, seatsPerRow: s.seatsPerRow, price: s.price }));
                                if (sections.length === 0) {
                                  toast.error("Add at least one section with a name");
                                  return;
                                }
                                setIsSeatMapSubmitting(true);
                                try {
                                  const result = await apiService.createEventSeatMap(id, { sections });
                                  toast.success(`Seat map created: ${result.seatsCreated} seats`);
                                  const seats = await apiService.getEventSeats(id);
                                  setEventSeats(seats);
                                } catch (err: any) {
                                  toast.error(err.response?.data?.message || "Failed to create seat map");
                                } finally {
                                  setIsSeatMapSubmitting(false);
                                }
                              }}
                            >
                              {isSeatMapSubmitting ? "Creating..." : "Create seat map"}
                            </Button>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )}

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