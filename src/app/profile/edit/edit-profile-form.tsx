"use client";

import { useActionState, useState } from "react";
import { updateProfile } from "@/app/profile/actions";

import { motion } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocationInput } from "@/components/LocationInput";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageUp } from "lucide-react";

export default function EditProfileForm({ initialData }: { initialData: any }) {
    const [state, action, isPending] = useActionState(updateProfile, null);
    const [preview, setPreview] = useState(initialData?.avatar_url || "");

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        setPreview(url);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="container py-10 max-w-2xl"
        >
            <Card className="rounded-2xl bg-card/60 backdrop-blur-xl shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        Edit Profile
                    </CardTitle>
                    <p className="text-muted-foreground text-sm">
                        Update your personal information.
                    </p>
                </CardHeader>

                <form
                    action={(formData) => {
                        action(formData);
                        if (state?.success) toast.success("Profile updated!");
                    }}
                >
                    <CardContent className="space-y-6 pt-4">
                        {/* Avatar Preview Section */}
                        <section className="flex flex-col items-center gap-4">
                            <Avatar className="h-28 w-28 border shadow-md">
                                <AvatarImage src={preview} />
                                <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                                    {initialData?.name?.[0] || "U"}
                                </AvatarFallback>
                            </Avatar>

                            <div className="w-full space-y-2">
                                <Label htmlFor="avatar">Profile Picture</Label>

                                <Input
                                    id="avatar"
                                    name="avatar"
                                    type="file"
                                    accept="image/*"
                                    className="cursor-pointer"
                                    onChange={handleAvatarChange}
                                />

                                <p className="text-xs text-muted-foreground">
                                    Upload a square image for the best result.
                                </p>
                            </div>
                        </section>

                        {/* Full Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={initialData?.name}
                                required
                            />
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" name="phone" defaultValue={initialData?.phone} />
                        </div>

                        {/* Bio */}
                        <div className="space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                                id="bio"
                                name="bio"
                                className="min-h-[120px]"
                                defaultValue={initialData?.bio}
                                placeholder="Tell us a little about yourself..."
                            />
                        </div>

                        {/* Address */}
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <LocationInput
                                id="address"
                                name="address"
                                defaultValue={initialData?.address}
                                placeholder="Start typing your address..."
                                onLocationSelect={(location, lat, lon) => {
                                    const latInput = document.getElementById('latitude') as HTMLInputElement;
                                    const lonInput = document.getElementById('longitude') as HTMLInputElement;
                                    if (latInput) latInput.value = lat?.toString() || '';
                                    if (lonInput) lonInput.value = lon?.toString() || '';
                                }}
                            />
                            <input type="hidden" id="latitude" name="latitude" defaultValue={initialData?.latitude} />
                            <input type="hidden" id="longitude" name="longitude" defaultValue={initialData?.longitude} />
                        </div>

                        {/* Error Message */}
                        {state?.error && (
                            <div className="text-sm text-red-500 font-medium pt-2">
                                {state.error}
                            </div>
                        )}

                        {/* Success Message */}
                        {state?.success && (
                            <div className="text-sm text-green-600 font-medium pt-2">
                                Profile updated successfully!
                            </div>
                        )}
                    </CardContent>

                    {/* Footer */}
                    <div className="p-6 pt-0 flex justify-end">
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="rounded-xl flex items-center gap-2"
                        >
                            {isPending ? (
                                "Saving..."
                            ) : (
                                <>
                                    <ImageUp className="h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Card>
        </motion.div>
    );
}
