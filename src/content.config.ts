import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import {
  casesSchema,
  contactSchema,
  educationSchema,
  experienceSchema,
  profileSchema,
  reposSchema,
  stackSchema,
  uiSchema,
  v2Schema,
} from './content/schemas';

function localeCollection(directory: string, schema: Parameters<typeof defineCollection>[0]['schema']) {
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
  repos: localeCollection('repos', reposSchema),
  ui: localeCollection('ui', uiSchema),
  v2: localeCollection('v2', v2Schema),
};
