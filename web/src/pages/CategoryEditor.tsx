import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from 'lucide-react';
import { CatalogSettings } from '../components/settings/CatalogSettings';
import { PageHeader } from '../components/ui/PageHeader';
import { pageClass } from '../utils/styles';

export function CategoryEditor() {
  const { name = '' } = useParams();
  const label = decodeURIComponent(name);
  const back = '/master/categories';
  return <div className={pageClass}>
    <Link to={back} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink">
      <ArrowLeftIcon className="h-4 w-4" /> Categories
    </Link>
    <PageHeader title={label || 'Category'} />
    <CatalogSettings focus={label} />
  </div>;
}
