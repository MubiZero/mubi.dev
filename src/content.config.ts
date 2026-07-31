import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import {
  casesSchema,
  contactSchema,
  experienceSchema,
  profileSchema,
  stackSchema,
  uiSchema,
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
  cases: localeCollection('cases', casesSchema),
  stack: localeCollection('stack', stackSchema),
  contact: localeCollection('contact', contactSchema),
  ui: localeCollection('ui', uiSchema),
};
