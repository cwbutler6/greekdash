import { DocsContentPageProps } from '@/types/docs';

export function DocsContentPage({ 
  title, 
  description, 
  section, 
  subsection, 
  children 
}: DocsContentPageProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
        <p className="text-xl text-muted-foreground">{description}</p>
      </div>
      
      {children || (
        <div className="prose prose-gray dark:prose-invert max-w-none">
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