# Create Public-Facing Chapter Pages

## Overview

Implement dynamic public pages for each chapter in GreekDash. These pages will display the chapter's name, public information, upcoming events, a photo gallery, and a contact form for recruits or interested individuals.

---

## Database Models (Prisma)

### Chapter

Ensure the `Chapter` model includes the following fields:

```prisma
model Chapter {
  id          Int      @id @default(autoincrement())
  name        String
  slug        String   @unique
  publicInfo  String?
  // ... other fields
}
```

### Event

Ensure the `Event` model includes:

```prisma
model Event {
  id          Int      @id @default(autoincrement())
  title       String
  date        DateTime
  isPublic    Boolean  @default(false)
  chapterId   Int
  chapter     Chapter  @relation(fields: [chapterId], references: [id])
  // ... other fields
}
```

### GalleryImage

Create a new model for gallery images:

```prisma
model GalleryImage {
  id          Int      @id @default(autoincrement())
  url         String
  caption     String?
  chapterId   Int
  chapter     Chapter  @relation(fields: [chapterId], references: [id])
}
```

### ContactMessage

Create a model to store contact form submissions:

```prisma
model ContactMessage {
  id          Int      @id @default(autoincrement())
  name        String
  email       String
  message     String
  chapterId   Int
  chapter     Chapter  @relation(fields: [chapterId], references: [id])
  createdAt   DateTime @default(now())
}
```

---

## Pages and Routing

### Dynamic Route

Create a dynamic route for chapter pages:

```
/app/[chapterSlug]/page.tsx
```

This page will fetch and display:

* Chapter name and public information
* Upcoming public events
* Photo gallery
* Contact form

---

## Components

Create the following components:

* `ChapterHeader`: Displays the chapter's name and public information.
* `EventsList`: Lists upcoming public events.
* `Gallery`: Displays gallery images.
* `ContactForm`: A form for users to contact the chapter.

Place these components in:

```
/components/chapters/
```

---

## API Routes

Create an API route to handle contact form submissions:

```
/app/api/contact/route.ts
```

This route will:

* Accept POST requests with contact form data.
* Validate and store the data in the `ContactMessage` model.

---

## Styling

Use `shadcn/ui` components and Tailwind CSS to style the pages and components for a cohesive and responsive design.

---

## Output

* Updated Prisma models: `Chapter`, `Event`, `GalleryImage`, `ContactMessage`
* Dynamic route: `/app/[chapterSlug]/page.tsx`
* Components: `ChapterHeader`, `EventsList`, `Gallery`, `ContactForm`
* API route: `/app/api/contact/route.ts`