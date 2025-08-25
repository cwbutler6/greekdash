import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Headings
    h1: ({ className, ...props }) => (
      <h1
        className={cn(
          'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-6',
          className
        )}
        {...props}
      />
    ),
    h2: ({ className, ...props }) => (
      <h2
        className={cn(
          'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mt-8 mb-4',
          className
        )}
        {...props}
      />
    ),
    h3: ({ className, ...props }) => (
      <h3
        className={cn(
          'scroll-m-20 text-2xl font-semibold tracking-tight mt-6 mb-3',
          className
        )}
        {...props}
      />
    ),
    h4: ({ className, ...props }) => (
      <h4
        className={cn(
          'scroll-m-20 text-xl font-semibold tracking-tight mt-4 mb-2',
          className
        )}
        {...props}
      />
    ),
    h5: ({ className, ...props }) => (
      <h5
        className={cn(
          'scroll-m-20 text-lg font-semibold tracking-tight mt-3 mb-2',
          className
        )}
        {...props}
      />
    ),
    h6: ({ className, ...props }) => (
      <h6
        className={cn(
          'scroll-m-20 text-base font-semibold tracking-tight mt-2 mb-1',
          className
        )}
        {...props}
      />
    ),
    
    // Paragraphs and text
    p: ({ className, ...props }) => (
      <p
        className={cn('leading-7 [&:not(:first-child)]:mt-6', className)}
        {...props}
      />
    ),
    
    // Lists
    ul: ({ className, ...props }) => (
      <ul className={cn('my-6 ml-6 list-disc', className)} {...props} />
    ),
    ol: ({ className, ...props }) => (
      <ol className={cn('my-6 ml-6 list-decimal', className)} {...props} />
    ),
    li: ({ className, ...props }) => (
      <li className={cn('mt-2', className)} {...props} />
    ),
    
    // Blockquotes
    blockquote: ({ className, ...props }) => (
      <blockquote
        className={cn(
          'mt-6 border-l-2 pl-6 italic text-muted-foreground',
          className
        )}
        {...props}
      />
    ),
    
    // Code
    code: ({ className, ...props }) => (
      <code
        className={cn(
          'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
          className
        )}
        {...props}
      />
    ),
    pre: ({ className, ...props }) => (
      <pre
        className={cn(
          'mb-4 mt-6 overflow-x-auto rounded-lg border bg-zinc-950 py-4 dark:bg-zinc-900',
          className
        )}
        {...props}
      />
    ),
    
    // Links
    a: ({ className, href, ...props }) => {
      if (href?.startsWith('/')) {
        return (
          <Link
            href={href}
            className={cn(
              'font-medium text-primary underline underline-offset-4 hover:no-underline',
              className
            )}
            {...props}
          />
        );
      }
      return (
        <a
          href={href}
          className={cn(
            'font-medium text-primary underline underline-offset-4 hover:no-underline',
            className
          )}
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        />
      );
    },
    
    // Tables
    table: ({ className, ...props }) => (
      <div className="my-6 w-full overflow-y-auto">
        <table className={cn('w-full', className)} {...props} />
      </div>
    ),
    tr: ({ className, ...props }) => (
      <tr
        className={cn('m-0 border-t p-0 even:bg-muted', className)}
        {...props}
      />
    ),
    th: ({ className, ...props }) => (
      <th
        className={cn(
          'border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right',
          className
        )}
        {...props}
      />
    ),
    td: ({ className, ...props }) => (
      <td
        className={cn(
          'border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right',
          className
        )}
        {...props}
      />
    ),
    
    // Horizontal rule
    hr: ({ ...props }) => <hr className="my-4 md:my-8" {...props} />,
    
    // Images
    img: ({ className, alt, ...props }) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={cn('rounded-md border', className)}
        alt={alt}
        {...props}
      />
    ),
    
    ...components,
  };
}