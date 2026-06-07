import type { PageLoad } from './$types';
export const ssr = true;
export const load: PageLoad = ({ params }) => {
  const cleanId = params.id.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 80) || 'class';
  return {
    title: `Class ${cleanId}`,
    description: 'SSR class detail for Learnzur SEO with subject, teacher, timetable, enrolment information, and parent-friendly overview.',
    classId: cleanId
  };
};
