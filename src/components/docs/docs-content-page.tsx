import { DocsContentPageProps } from '@/types/docs';

export function DocsContentPage({ 
  title, 
  description, 
  section, 
  subsection, 
  children 
}: DocsContentPageProps) {
  return (
    <div className="space-y-6 mx-auto max-w-4xl">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
        <p className="text-xl text-muted-foreground">{description}</p>
      </div>
      
      {children || (
        <div className="prose prose-gray dark:prose-invert max-w-none mx-auto">
          <p>
            This documentation page is under construction. Content for the {section}
            {subsection && ` > ${subsection}`} section will be added soon.
          </p>
          <p>
            In the meantime, you can explore other sections of the documentation or 
            contact our support team if you need immediate assistance.
          </p>
        </div>
      )}
    </div>
  );
}