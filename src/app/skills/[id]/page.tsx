import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import {
    MapPin,
    DollarSign,
    Briefcase,
    Phone,
} from "lucide-react";

import BookingForm from "./BookingForm";
import MessageProviderButton from "./MessageProviderButton";
import DeleteSkillButton from "./DeleteSkillButton";

export default async function SkillDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data: skill, error } = await supabase
        .from("skills")
        .select(
            `
      *,
      provider:profiles(id, name, avatar_url, bio, role, phone)
    `
        )
        .eq("id", id)
        .single();

    if (error || !skill) notFound();

    const isOwner = user?.id === skill.provider_id;

    return (
        <div className="container py-12">
            <div className="grid gap-10 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-10">
                    {/* Header Section */}
                    <section>
                        <div className="flex items-center gap-3 mb-3">
                            <Badge className="capitalize px-3 py-1">{skill.category}</Badge>

                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {skill.address}
                            </span>
                        </div>

                        <h1 className="text-4xl font-bold tracking-tight mb-4">
                            {skill.title}
                        </h1>

                        <div className="flex items-center gap-6 text-lg font-medium">
                            <span className="text-primary flex items-center gap-1 font-semibold">
                                <DollarSign className="h-5 w-5" /> ₹{skill.price}
                            </span>

                            <span className="text-muted-foreground flex items-center gap-1">
                                <Briefcase className="h-5 w-5" /> {skill.experience} exp
                            </span>
                        </div>
                    </section>

                    {/* Description Card */}
                    <Card className="rounded-2xl bg-card/60 backdrop-blur shadow-sm">
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="leading-relaxed whitespace-pre-wrap text-muted-foreground">
                                {skill.description}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Provider Card */}
                    <Card className="rounded-2xl bg-card/60 backdrop-blur shadow-sm">
                        <CardHeader>
                            <CardTitle>About the Provider</CardTitle>
                        </CardHeader>

                        <CardContent className="flex gap-5">
                            <Avatar className="h-20 w-20 border shadow-sm">
                                <AvatarImage src={skill.provider?.avatar_url} />
                                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                    {skill.provider?.name?.[0] || "P"}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 space-y-3">
                                <h3 className="text-xl font-semibold">
                                    {skill.provider?.name}
                                </h3>

                                <p className="text-muted-foreground leading-relaxed">
                                    {skill.provider?.bio || "No bio available."}
                                </p>

                                <div className="flex gap-3 pt-2">
                                    <MessageProviderButton providerId={skill.provider?.id} />

                                    {skill.provider?.phone && (
                                        <Link href={`tel:${skill.provider.phone}`}>
                                            <Button variant="outline" size="sm">
                                                <Phone className="h-4 w-4 mr-2" />
                                                Call
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Booking Sidebar */}
                <div>
                    <Card className="sticky top-28 rounded-2xl shadow-sm bg-card/60 backdrop-blur">
                        <CardHeader>
                            <CardTitle>Book This Service</CardTitle>
                        </CardHeader>

                        <CardContent>
                            {isOwner ? (
                                <div className="space-y-3 bg-muted/30 rounded-xl p-6">
                                    <p className="text-muted-foreground text-center">
                                        You listed this skill.
                                    </p>
                                    <Link href="/provider/skills">
                                        <Button className="w-full rounded-xl" variant="outline">
                                            Manage Skills
                                        </Button>
                                    </Link>
                                    <DeleteSkillButton skillId={skill.id} />
                                </div>
                            ) : (
                                <BookingForm
                                    skillId={skill.id}
                                    providerId={skill.provider.id}
                                    price={skill.price}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    );
}
