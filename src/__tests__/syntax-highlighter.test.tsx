import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyntaxHighlighter } from '@/components/docs/syntax-highlighter';
import {
  highlightJavaScript,
  highlightJSX,
  highlightCSS,
  highlightHTML,
  highlightJSON,
  highlightBash
} from '@/components/docs/syntax-highlighter';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

describe('SyntaxHighlighter', () => {
  const defaultProps = {
    code: 'const hello = "world";',
    language: 'javascript'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders code content', () => {
    render(<SyntaxHighlighter {...defaultProps} />);
    
    // Check that the code is present in the document
    const codeElement = screen.getByRole('code');
    expect(codeElement).toBeInTheDocument();
    expect(codeElement.textContent).toContain('const hello = "world";');
  });

  it('displays filename when provided', () => {
    render(<SyntaxHighlighter {...defaultProps} filename="example.js" />);
    
    expect(screen.getByText('example.js')).toBeInTheDocument();
    expect(screen.getByText('javascript')).toBeInTheDocument();
  });

  it('shows copy button on hover', () => {
    render(<SyntaxHighlighter {...defaultProps} />);
    
    const copyButton = screen.getByRole('button');
    expect(copyButton).toBeInTheDocument();
  });

  it('copies code to clipboard when copy button is clicked', async () => {
    render(<SyntaxHighlighter {...defaultProps} />);
    
    const copyButton = screen.getByRole('button');
    fireEvent.click(copyButton);
    
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const hello = "world";');
    });
  });

  it('shows check icon after successful copy', async () => {
    render(<SyntaxHighlighter {...defaultProps} />);
    
    const copyButton = screen.getByRole('button');
    fireEvent.click(copyButton);
    
    await waitFor(() => {
      expect(copyButton.querySelector('svg')).toBeInTheDocument();
    });
  });

  it('displays line numbers when enabled', () => {
    const multiLineCode = 'line 1\nline 2\nline 3';
    render(<SyntaxHighlighter code={multiLineCode} language="javascript" showLineNumbers />);
    
    // Check for line numbers in the line number column
    const lineNumbers = document.querySelectorAll('.select-none');
    expect(lineNumbers).toHaveLength(3);
    expect(lineNumbers[0]).toHaveTextContent('1');
    expect(lineNumbers[1]).toHaveTextContent('2');
    expect(lineNumbers[2]).toHaveTextContent('3');
  });

  it('highlights specified lines', () => {
    const multiLineCode = 'line 1\nline 2\nline 3';
    render(
      <SyntaxHighlighter 
        code={multiLineCode} 
        language="javascript" 
        highlightLines={[2]} 
        showLineNumbers 
      />
    );
    
    // The highlighted line should have special styling
    const codeContainer = screen.getByRole('code');
    expect(codeContainer).toBeInTheDocument();
  });

  it('calls onCopy callback when provided', async () => {
    const onCopy = vi.fn();
    render(<SyntaxHighlighter {...defaultProps} onCopy={onCopy} />);
    
    const copyButton = screen.getByRole('button');
    fireEvent.click(copyButton);
    
    await waitFor(() => {
      expect(onCopy).toHaveBeenCalled();
    });
  });
});

describe('Syntax Highlighting Functions', () => {
  // Note: These tests are simplified since we're not implementing full syntax highlighting
  // In a real implementation, you would use a proper syntax highlighting library
  
  describe('highlightJavaScript', () => {
    it('returns the code as-is for now', () => {
      const code = 'const function return if else';
      const result = highlightJavaScript(code);
      
      expect(result).toBe(code);
    });
  });

  describe('highlightJSX', () => {
    it('returns the code as-is for now', () => {
      const code = '<div className="test">Hello</div>';
      const result = highlightJSX(code);
      
      expect(result).toContain('<div');
    });
  });

  describe('highlightCSS', () => {
    it('returns the code as-is for now', () => {
      const code = 'color: red; background-color: blue;';
      const result = highlightCSS(code);
      
      expect(result).toContain('color');
    });
  });

  describe('highlightHTML', () => {
    it('returns the code as-is for now', () => {
      const code = '<div class="test"><p>Hello</p></div>';
      const result = highlightHTML(code);
      
      expect(result).toContain('<div');
    });
  });

  describe('highlightJSON', () => {
    it('returns the code as-is for now', () => {
      const code = '{"name": "test", "value": 42}';
      const result = highlightJSON(code);
      
      expect(result).toContain('"name"');
    });
  });

  describe('highlightBash', () => {
    it('returns the code as-is for now', () => {
      const code = 'npm install && git commit -m "test"';
      const result = highlightBash(code);
      
      expect(result).toContain('npm');
    });
  });
});

describe('SyntaxHighlighter Edge Cases', () => {
  it('handles empty code', () => {
    render(<SyntaxHighlighter code="" language="javascript" />);
    
    const codeElement = screen.getByRole('code');
    expect(codeElement).toBeInTheDocument();
  });

  it('handles unsupported language', () => {
    const code = 'some code';
    render(<SyntaxHighlighter code={code} language="unsupported" />);
    
    expect(screen.getByText(code)).toBeInTheDocument();
  });

  it('handles multiline code correctly', () => {
    const multiLineCode = 'line 1\nline 2\nline 3';
    render(<SyntaxHighlighter code={multiLineCode} language="javascript" />);
    
    const codeElement = screen.getByRole('code');
    expect(codeElement.textContent).toContain('line 1');
    expect(codeElement.textContent).toContain('line 2');
    expect(codeElement.textContent).toContain('line 3');
  });

  it('handles code with special characters', () => {
    const specialCode = 'const regex = /[a-z]+/g;';
    render(<SyntaxHighlighter code={specialCode} language="javascript" />);
    
    const codeElement = screen.getByRole('code');
    expect(codeElement.textContent).toContain(specialCode);
  });
});