import React from 'react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function PathBreadcrumb() {
  const { user } = useAuth();

  if (!user?.path) return null;

  // Parse the path and filter out empty segments
  const pathSegments = user.path.split('\\').filter(segment => segment.trim() !== '');

  // Append employeeId at the end (if available)
  if (user.employeeId) {
    pathSegments.push(user.employeeId);
  }

  if (pathSegments.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-slate-200/60 px-3 py-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-slate-600">
          <Building2 className="h-4 w-4" />
          <span className="font-medium">GoPocket :</span>
        </div>
        
        <Breadcrumb>
          <BreadcrumbList>
            {pathSegments.map((segment, index) => (
              <React.Fragment key={index}>
                <BreadcrumbItem>
                  {index === pathSegments.length - 1 ? (
                    <BreadcrumbPage className="font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
                      {segment}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink className="text-slate-700 hover:text-blue-600 transition-colors font-medium">
                      {segment}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < pathSegments.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
}
