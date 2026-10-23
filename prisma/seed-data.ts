import type { Prisma } from "../src/generated/prisma/client.js";

export const assignments = [
  {
    assignmentNumber: 1,
    title: "Personal Portfolio Website",
    description:
      "Build a responsive personal portfolio website that includes a hero section, about section, skills, projects, contact form, and responsive navigation. The project should be deployed and the source code must be available in a public GitHub repository.",
    maxMarks: 50,
  },
  {
    assignmentNumber: 2,
    title: "Task Management Application",
    description:
      "Create a task management application where users can add, edit, delete, and update the status of tasks. Include basic form validation, filtering by task status, and a clean responsive interface.",
    maxMarks: 50,
  },
  {
    assignmentNumber: 3,
    title: "Product Listing Dashboard",
    description:
      "Develop a product listing dashboard that displays products in a table or card layout. Implement search, category filtering, sorting, pagination, and a product details view using mock or external API data.",
    maxMarks: 50,
  },
  {
    assignmentNumber: 4,
    title: "Full-Stack Blog Application",
    description:
      "Build a full-stack blog application with user authentication. Authenticated users should be able to create, update, and delete their own posts. Public users should be able to browse and view published blog posts.",
    maxMarks: 50,
  },
  {
    assignmentNumber: 5,
    title: "Final Full-Stack Project",
    description:
      "Build a complete full-stack web application that demonstrates frontend development, backend API integration, database usage, authentication, authorization, validation, responsive design, and deployment. The project should solve a real-world problem and include proper documentation.",
    maxMarks: 60,
  },
] satisfies Prisma.AssignmentCreateManyInput[];
