'use client';

import { Chapter } from '@/generated/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ChapterHeaderProps {
  chapter: Pick<Chapter, 'name' | 'publicInfo'>;
}

export function ChapterHeader({ chapter }: ChapterHeaderProps) {
  return (
    <Card className="w-full mb-8">
      <CardHeader>
        <CardTitle className="text-3xl font-bold">{chapter.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {chapter.publicInfo ? (
          <div className="prose max-w-none">
            <p>{chapter.publicInfo}</p>
          </div>
        ) : (
          <CardDescription>This chapter hasn&apos;t added any public information yet.</CardDescription>
        )}
      </CardContent>
    </Card>
  );
}
