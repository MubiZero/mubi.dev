import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import type { z } from 'astro/zod';
import {
  casesSchema,
  contactSchema,
  copySchema,
  educationSchema,
  experienceSchema,
  profileSchema,
  projectsSchema,
  reposSchema,
  stackSchema,
  uiSchema,
} from './content/schemas';

// Generic in the schema on purpose: widening it to defineCollection's own
// parameter type erased what each collection holds, and every consumer of
// getEntry() then received `unknown`.
function localeCollection<S extends z.ZodTypeAny>(directory: string, schema: S) {
  return defineCollection({
    loader: glob({ base: `./src/content/${directory}`, pattern: '*.yaml' }),
    schema,
  });
}

export const collections = {
  profile: localeCollection('profile', profileSchema),
  experience: localeCollection('experience', experienceSchema),
  education: localeCollection('education', educationSchema),
  cases: localeCollection('cases', casesSchema),
  stack: localeCollection('stack', stackSchema),
  contact: localeCollection('contact', contactSchema),
  projects: localeCollection('projects', projectsSchema),
  repos: localeCollection('repos', reposSchema),
  ui: localeCollection('ui', uiSchema),
  copy: localeCollection('copy', copySchema),
};
