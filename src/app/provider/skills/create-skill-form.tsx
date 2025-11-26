'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSkill } from '@/app/provider/actions'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LocationInput } from '@/components/LocationInput'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from '@/components/ui/select'

export default function CreateSkillForm() {
    const router = useRouter()
    const [state, action, isPending] = useActionState(createSkill, null)

    useEffect(() => {
        if (state?.success) {
            toast.success('Skill created successfully!')
            router.push('/dashboard')
        }
    }, [state?.success, router])

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full"
        >
            <Card className="rounded-2xl shadow-sm bg-card/60 backdrop-blur-xl">
                <CardHeader>
                    <CardTitle className="text-xl font-bold tracking-tight">
                        Create New Skill
                    </CardTitle>
                </CardHeader>

                <form action={action}>
                    <CardContent className="space-y-6 pt-2">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title">
                                Skill Title <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="e.g. Plumbing, Math Tutoring"
                                required
                                className="rounded-xl"
                            />
                        </div>

                        {/* Category (Select component) */}
                        <div className="space-y-2">
                            <Label>
                                Category <span className="text-red-500">*</span>
                            </Label>

                            <Select name="category" required>
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="Home Repair">Home Repair</SelectItem>
                                    <SelectItem value="Education">Education</SelectItem>
                                    <SelectItem value="Fitness">Fitness</SelectItem>
                                    <SelectItem value="Beauty">Beauty</SelectItem>
                                    <SelectItem value="Technology">Technology</SelectItem>
                                    <SelectItem value="Design">Design</SelectItem>
                                    <SelectItem value="Business">Business</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">
                                Description <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Describe your service..."
                                required
                                className="min-h-[130px] rounded-xl"
                            />
                        </div>

                        {/* Price + Experience */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">
                                    Price (₹) <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="price"
                                        name="price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        className="rounded-xl"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                        /hour
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="experience">
                                    Experience <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="experience"
                                    name="experience"
                                    placeholder="e.g. 5 years"
                                    required
                                    className="rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div className="space-y-2">
                            <Label htmlFor="address">
                                Service Area / Address <span className="text-red-500">*</span>
                            </Label>
                            <LocationInput
                                id="address"
                                name="address"
                                placeholder="Where do you provide this service?"
                                required
                                className="rounded-xl"
                                onLocationSelect={(location, lat, lon) => {
                                    const latInput = document.getElementById('latitude') as HTMLInputElement;
                                    const lonInput = document.getElementById('longitude') as HTMLInputElement;
                                    if (latInput) latInput.value = lat?.toString() || '';
                                    if (lonInput) lonInput.value = lon?.toString() || '';
                                }}
                            />
                            <input type="hidden" id="latitude" name="latitude" />
                            <input type="hidden" id="longitude" name="longitude" />
                        </div>

                        {/* Error Message */}
                        {state?.error && (
                            <p className="text-sm text-red-500 font-medium">
                                {state.error}
                            </p>
                        )}

                        {/* Button */}
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="w-full rounded-xl"
                        >
                            {isPending ? 'Creating...' : 'Create Skill'}
                        </Button>
                    </CardContent>
                </form>
            </Card>
        </motion.div>
    )
}
