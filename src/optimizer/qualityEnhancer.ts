import { DeepRepoProfile } from "../intelligence/types";

export class QualityEnhancer {
  enhance(prompt: string, repo: DeepRepoProfile): string {
    const enhancements: string[] = [];

    if (repo.language === "TypeScript") {
      enhancements.push("- Ensure strict typing and proper interfaces.");
    }

    if (repo.framework === "React" || repo.framework === "Next.js") {
      enhancements.push("- Follow React best practices and avoid unnecessary re-renders.");
    }

    if (repo.framework === "Next.js") {
      enhancements.push("- Consider SSR/SSG implications.");
    }

    if (repo.framework === "NestJS" || repo.framework === "Express") {
      enhancements.push("- Follow RESTful conventions and proper error handling.");
    }

    if (repo.testing) {
      enhancements.push(`- Write tests using ${repo.testing}.`);
    }

    if (repo.styling === "Tailwind") {
      enhancements.push("- Use Tailwind utility classes for styling.");
    }

    if (enhancements.length === 0) {
      return prompt;
    }

    return `${prompt}\n\n### Quality Guidelines\n${enhancements.join("\n")}`;
  }
}
