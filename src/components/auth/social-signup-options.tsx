"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Users } from "lucide-react";
import { SocialChapterForm } from "./social-chapter-form";
import { SocialJoinForm } from "@/components/auth/social-join-form";

export function SocialSignupOptions() {
  const [activeTab, setActiveTab] = useState("create");

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Create Chapter
            </TabsTrigger>
            <TabsTrigger value="join" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Join Chapter
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="create" className="mt-6">
            <div className="space-y-4">
              <SocialChapterForm />
            </div>
          </TabsContent>
          
          <TabsContent value="join" className="mt-6">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold text-lg">Join Existing Chapter</h3>
                <p className="text-sm text-gray-600">
                  Enter a join code to join an existing chapter
                </p>
              </div>
              <SocialJoinForm />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}