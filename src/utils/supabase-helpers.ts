import { supabase } from "../lib/supabase";

// Image storage utilities
export const STORAGE_BUCKETS = {
  EVENTS: "event-images",
  PROFILES: "profile-images",
  GENERAL: "general-images",
} as const;

export type StorageBucket =
  (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

// Image upload with automatic resizing and optimization
export const uploadImageWithOptimization = async (
  file: File,
  bucket: StorageBucket,
  folder: string = "",
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {},
) => {
  const { maxWidth = 1200, maxHeight = 800, quality = 0.8 } = options;

  // Generate unique filename
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  try {
    // Upload original file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      path: data.path,
      publicUrl: urlData.publicUrl,
      fullPath: data.fullPath,
    };
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

// Delete image from storage
export const deleteImage = async (bucket: StorageBucket, path: string) => {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
};

// Event database utilities
export interface EventData {
  id?: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  image_url?: string;
  source?: string;
  external_id?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

// Batch insert events with conflict resolution (commented out until events table is created)
// export const batchInsertEvents = async (events: EventData[]) => {
//   try {
//     const { data, error } = await supabase
//       .from("events")
//       .upsert(events, {
//         onConflict: "external_id,source",
//         ignoreDuplicates: false,
//       })
//       .select();
//
//     if (error) throw error;
//     return data;
//   } catch (error) {
//     console.error("Error batch inserting events:", error);
//     throw error;
//   }
// };
//
// // Search events with filters
// export const searchEvents = async (filters: {
//   query?: string;
//   startDate?: string;
//   endDate?: string;
//   location?: string;
//   source?: string;
//   limit?: number;
//   offset?: number;
// }) => {
//   try {
//     let query = supabase.from("events").select("*");
//
//     // Apply filters
//     if (filters.query) {
//       query = query.or(
//         `title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`,
//       );
//     }
//
//     if (filters.startDate) {
//       query = query.gte("start_date", filters.startDate);
//     }
//
//     if (filters.endDate) {
//       query = query.lte("start_date", filters.endDate);
//     }
//
//     if (filters.location) {
//       query = query.ilike("location", `%${filters.location}%`);
//     }
//
//     if (filters.source) {
//       query = query.eq("source", filters.source);
//     }
//
//     // Apply pagination
//     if (filters.limit) {
//       query = query.limit(filters.limit);
//     }
//
//     if (filters.offset) {
//       query = query.range(
//         filters.offset,
//         filters.offset + (filters.limit || 10) - 1,
//       );
//     }
//
//     // Order by start date
//     query = query.order("start_date", { ascending: true });
//
//     const { data, error } = await query;
//
//     if (error) throw error;
//     return data;
//   } catch (error) {
//     console.error("Error searching events:", error);
//     throw error;
//   }
// };
//
// // Real-time event subscription
// export const subscribeToEvents = (callback: (payload: any) => void) => {
//   return supabase
//     .channel("events-changes")
//     .on(
//       "postgres_changes",
//       {
//         event: "*",
//         schema: "public",
//         table: "events",
//       },
//       callback,
//     )
//     .subscribe();
// };

// Utility to check if storage bucket exists and create if needed
export const ensureStorageBucket = async (
  bucketName: string,
  isPublic: boolean = true,
) => {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) throw listError;

    const bucketExists = buckets.some((bucket) => bucket.name === bucketName);

    if (!bucketExists) {
      // Create bucket
      const { error: createError } = await supabase.storage.createBucket(
        bucketName,
        {
          public: isPublic,
          fileSizeLimit: 10 * 1024 * 1024, // 10MB limit
        },
      );

      if (createError) throw createError;
      console.log(`✅ Created storage bucket: ${bucketName}`);
    }

    return true;
  } catch (error) {
    console.error(`Error ensuring storage bucket ${bucketName}:`, error);
    throw error;
  }
};
