import { createBrowserRouter } from 'react-router-dom';
import FormsList from './pages/FormsList';
import FormBuilder from './pages/FormBuilder';
import PublicForm from './pages/PublicForm';
import SubmissionsGrid from './pages/SubmissionsGrid';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <FormsList />,
  },
  {
    path: '/forms',
    element: <FormsList />,
  },
  {
    path: '/forms/new',
    element: <FormBuilder />,
  },
  {
    path: '/forms/:formId/edit',
    element: <FormBuilder />,
  },
  {
    path: '/forms/:formId/submissions',
    element: <SubmissionsGrid />,
  },
  {
    path: '/forms/:slug',
    element: <PublicForm />,
  },
]);

