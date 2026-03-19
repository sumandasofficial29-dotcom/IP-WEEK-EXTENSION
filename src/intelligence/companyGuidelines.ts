/**
 * Company-specific coding guidelines by language
 * These are condensed actionable rules extracted from corporate standards
 */

export interface LanguageGuidelines {
  language: string;
  guidelines: string;
}

/**
 * Get company coding guidelines for a specific language
 */
export function getCompanyGuidelines(primaryLanguage: string): string | null {
  const lang = primaryLanguage.toLowerCase();
  
  if (lang === "c++" || lang === "cpp" || lang === "c") {
    return getCppGuidelines();
  }
  
  // Add more languages as needed
  // if (lang === "java") return getJavaGuidelines();
  // if (lang === "python") return getPythonGuidelines();
  
  return null;
}

/**
 * Amadeus C++ Coding Guidelines (condensed)
 * Full reference: C++ Core Guidelines + Amadeus internal standards
 */
function getCppGuidelines(): string {
  return `## C++ Coding Standards

### Naming Conventions
- **Files**: lowercase with underscores (my_class.cpp, my_class.hpp)
- **Classes**: UpperCamelCase, singular (HttpUrlChecker, not HTTPURLChecker)
- **Methods**: camelCase (getFlightNumber, addTableEntry)
- **Free functions/static methods**: UpperCamelCase (GetMyName)
- **Namespaces**: all lowercase (amadeus_project)
- **Constants**: kConstantName or CONSTANT_NAME
- **Typedefs**: end with _t (SignalMap_t)
- **No double underscores or leading underscore+uppercase** (reserved)

### File Structure
- Use .hpp for C++ headers, .cpp for source
- Use \`#pragma once\` as include guard
- Include order: C system → C++ system → other libs → project headers
- Use forward declarations when possible to reduce dependencies

### Formatting
- Max line length: 120 characters
- Indentation: 2 spaces (no tabs)
- UTF-8 encoding, Unix line endings (LF)
- Open brace on same line, else on new line
- Always use braces for if/for/while blocks

### Code Style
- Prefer readability over cleverness
- Use standard types (int32_t, uint64_t) not AMD_xxx types
- Don't nest ternary operators
- Function params: inputs first, then outputs
- Comment with Doxygen using @command (not \\command)

### Logging
- Use mdw::Tracer library for all logging
- Never use raw printf/scanf

### Comments
- Include copyright notice: © YYYY Copyright Amadeus
- Use Doxygen for documentation (@brief, @param, @return)
- TODO format: TODO(email): description
- Mark deprecated code with [[deprecated("reason")]]

### Unit Testing (Google Test)
- Naming: \`<method>_When<condition>_Should<expected>\`
- Use AAA pattern: Arrange → Act → Assert
- One test = one method, one path
- Prefer EXPECT_* over ASSERT_* (allows multiple failures)
- Keep tests fast, isolated, and readable`;
}

/**
 * Check if guidelines exist for a language
 */
export function hasCompanyGuidelines(primaryLanguage: string): boolean {
  const lang = primaryLanguage.toLowerCase();
  return lang === "c++" || lang === "cpp" || lang === "c";
}
