import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { formsApi } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { copyToClipboard, formatDate } from '@/lib/utils'
import {
  Plus,
  Search,
  ExternalLink,
  Copy,
  BarChart3,
  Edit,
  FileText,
  Sparkles,
} from 'lucide-react'
import type { FormListItem } from '@/types/form'

export default function Dashboard() {
  const { userEmail } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateForm = async () => {
    if (!aiPrompt.trim() || aiPrompt.length < 10) {
      addToast('Please enter a more detailed description (at least 10 characters)', 'error')
      return
    }

    setIsGenerating(true)
    try {
      const result = await formsApi.generateForm(aiPrompt)
      addToast(`Form "${result.name}" created successfully!`, 'success')
      setAiDialogOpen(false)
      setAiPrompt('')
      queryClient.invalidateQueries({ queryKey: ['forms'] })
      // Navigate to edit the newly created form
      navigate(`/forms/${result.formId}/edit`)
    } catch (err: any) {
      addToast(err.message || 'Failed to generate form', 'error')
    } finally {
      setIsGenerating(false)
    }
  }

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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAiDialogOpen(true)} className="gap-2">
            <Sparkles className="w-4 h-4" />
            Create with AI
          </Button>
          <Button onClick={() => navigate('/forms/new')} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Form
          </Button>
        </div>
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

      {/* AI Generate Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Create Form with AI
            </DialogTitle>
            <DialogDescription>
              Describe the form you want to create and AI will generate it for you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="ai-prompt">Describe your form</Label>
              <Textarea
                id="ai-prompt"
                placeholder="e.g., Create a job application form with fields for name, email, phone, resume upload, years of experience, and a cover letter..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Be specific about the fields you need and any validation requirements.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setAiDialogOpen(false)
                  setAiPrompt('')
                }}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateForm}
                disabled={isGenerating || aiPrompt.length < 10}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Spinner size="sm" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Form
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

