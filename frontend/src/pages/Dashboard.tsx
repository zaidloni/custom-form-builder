import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { formsApi } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { copyToClipboard, formatDate } from '@/lib/utils'
import {
  Plus,
  Search,
  ExternalLink,
  Copy,
  BarChart3,
  Edit,
  FileText,
} from 'lucide-react'
import type { FormListItem } from '@/types/form'

export default function Dashboard() {
  const { userEmail } = useAuth()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['forms', userEmail],
    queryFn: () => formsApi.listForms(),
    enabled: !!userEmail,
  })

  // Group forms by formId to get latest version only
  const latestForms = data?.forms.reduce((acc, form) => {
    if (!acc[form.formId] || acc[form.formId].version < form.version) {
      acc[form.formId] = form
    }
    return acc
  }, {} as Record<string, FormListItem>)

  const forms = Object.values(latestForms || {}).filter((form) =>
    form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    form.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCopyUrl = async (url: string) => {
    await copyToClipboard(url)
    addToast('URL copied to clipboard!', 'success')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load forms. Please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-slide-down">
        <div>
          <h1 className="text-3xl font-bold">My Forms</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your forms
          </p>
        </div>
        <Button onClick={() => navigate('/forms/new')} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Form
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6 animate-slide-up stagger-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search forms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 max-w-md"
        />
      </div>

      {/* Forms grid */}
      {forms.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {searchQuery ? 'No forms found' : 'No forms yet'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? 'Try a different search term'
              : 'Create your first form to get started'}
          </p>
          {!searchQuery && (
            <Button onClick={() => navigate('/forms/new')} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Form
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((form, index) => (
            <Card
              key={form.formId}
              className="group hover:border-primary/50 transition-all duration-200 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-1">{form.name}</CardTitle>
                  <Badge variant="secondary" className="shrink-0">
                    v{form.version}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {form.description || 'No description'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground mb-4">
                  Created {formatDate(form.createdAt)}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/forms/${form.formId}/edit`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                  </Link>
                  <Link to={`/forms/${form.formId}/submissions`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5" />
                      Responses
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => handleCopyUrl(form.formUrl)}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy URL
                  </Button>
                  <a
                    href={form.formUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

