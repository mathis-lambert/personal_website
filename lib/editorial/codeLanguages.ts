const CODE_LANGUAGE_OPTIONS = [
  { value: "text", label: "Plain text" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "jsx", label: "JSX" },
  { value: "tsx", label: "TSX" },
  { value: "python", label: "Python" },
  { value: "bash", label: "Bash" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "sql", label: "SQL" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "java", label: "Java" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "dockerfile", label: "Dockerfile" },
  { value: "markdown", label: "Markdown" },
  { value: "mermaid", label: "Mermaid" },
] as const;

export const codeLanguageOptions = (currentLanguage: string) => {
  if (
    CODE_LANGUAGE_OPTIONS.some(
      (option) => option.value === currentLanguage,
    )
  ) {
    return [...CODE_LANGUAGE_OPTIONS];
  }

  return [
    { value: currentLanguage, label: currentLanguage },
    ...CODE_LANGUAGE_OPTIONS,
  ];
};
