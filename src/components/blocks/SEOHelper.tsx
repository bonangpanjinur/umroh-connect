import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Lightbulb, RefreshCw } from 'lucide-react';
import {
  generateSEOSuggestions,
  validateSEO,
  getSEOScoreColor,
  getSEOScoreLabel,
  getCopywritingSuggestions,
  getTemplateSuggestions,
} from '@/utils/seoHelper';

interface SEOHelperProps {
  pageTitle: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  onMetaTitleChange: (value: string) => void;
  onMetaDescriptionChange: (value: string) => void;
  onKeywordsChange: (value: string) => void;
}

export function SEOHelper({
  pageTitle,
  metaTitle,
  metaDescription,
  keywords,
  onMetaTitleChange,
  onMetaDescriptionChange,
  onKeywordsChange,
}: SEOHelperProps) {
  const [suggestions, setSuggestions] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [showCopywritingTips, setShowCopywritingTips] = useState(false);

  useEffect(() => {
    if (pageTitle) {
      const seoSuggestions = generateSEOSuggestions(pageTitle);
      setSuggestions(seoSuggestions);

      const keywordArray = keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);
      const seoMetrics = validateSEO(metaTitle, metaDescription, keywordArray);
      setMetrics(seoMetrics);
    }
  }, [pageTitle, metaTitle, metaDescription, keywords]);

  const applySuggestions = () => {
    if (suggestions) {
      onMetaTitleChange(suggestions.metaTitle);
      onMetaDescriptionChange(suggestions.metaDescription);
      onKeywordsChange(suggestions.keywords.join(', '));
    }
  };

  const templateSuggestions = getTemplateSuggestions(pageTitle);
  const copywritingSuggestions = getCopywritingSuggestions(templateSuggestions[0]);

  return (
    <div className="space-y-4">
      {/* SEO Score */}
      {metrics && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-100 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">SEO Score</p>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold">{metrics.score}</div>
                  <div>
                    <p className={`font-semibold ${getSEOScoreColor(metrics.score)}`}>
                      {getSEOScoreLabel(metrics.score)}
                    </p>
                    <p className="text-xs text-muted-foreground">dari 100</p>
                  </div>
                </div>
              </div>
              <div className="w-24 h-24 rounded-full border-4 border-blue-200 dark:border-blue-800 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getSEOScoreColor(metrics.score)}`}>
                    {metrics.score}%
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto Suggestions */}
      {suggestions && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Saran SEO Otomatis
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={applySuggestions}
                className="gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Terapkan
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Meta Title</p>
              <p className="text-sm">{suggestions.metaTitle}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {suggestions.metaTitle.length} karakter (ideal: 50-60)
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Meta Description</p>
              <p className="text-sm">{suggestions.metaDescription}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {suggestions.metaDescription.length} karakter (ideal: 150-160)
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Keywords</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {suggestions.keywords.map((keyword: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meta Title */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="meta_title" className="flex items-center gap-2">
            Meta Title
            {metrics?.titleOK ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            )}
          </Label>
          <span className={`text-xs font-medium ${
            metrics?.titleOK ? 'text-green-600' : 'text-yellow-600'
          }`}>
            {metrics?.titleLength || 0}/60
          </span>
        </div>
        <Input
          id="meta_title"
          value={metaTitle}
          onChange={(e) => onMetaTitleChange(e.target.value)}
          placeholder="Judul untuk search engine"
          maxLength={60}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Tampil di hasil pencarian Google. Ideal: 50-60 karakter.
        </p>
      </div>

      {/* Meta Description */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="meta_description" className="flex items-center gap-2">
            Meta Description
            {metrics?.descriptionOK ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            )}
          </Label>
          <span className={`text-xs font-medium ${
            metrics?.descriptionOK ? 'text-green-600' : 'text-yellow-600'
          }`}>
            {metrics?.descriptionLength || 0}/160
          </span>
        </div>
        <Textarea
          id="meta_description"
          value={metaDescription}
          onChange={(e) => onMetaDescriptionChange(e.target.value)}
          placeholder="Deskripsi singkat untuk hasil pencarian"
          rows={3}
          maxLength={160}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Tampil di bawah judul di hasil pencarian. Ideal: 150-160 karakter.
        </p>
      </div>

      {/* Keywords */}
      <div>
        <Label htmlFor="keywords">Keywords (dipisahkan dengan koma)</Label>
        <Input
          id="keywords"
          value={keywords}
          onChange={(e) => onKeywordsChange(e.target.value)}
          placeholder="umroh, paket hemat, travel"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Kata kunci yang relevan untuk halaman ini. Pisahkan dengan koma.
        </p>
      </div>

      {/* Copywriting Tips */}
      {copywritingSuggestions && Object.keys(copywritingSuggestions).length > 0 && (
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800">
          <CardHeader className="pb-3">
            <button
              onClick={() => setShowCopywritingTips(!showCopywritingTips)}
              className="flex items-center justify-between w-full text-left"
            >
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-600" />
                Saran Copywriting
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                {showCopywritingTips ? '▼' : '▶'}
              </span>
            </button>
          </CardHeader>
          {showCopywritingTips && (
            <CardContent className="space-y-3">
              {Object.entries(copywritingSuggestions).map(([key, value]) => (
                <div key={key} className="p-3 bg-white dark:bg-black/20 rounded-lg">
                  <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-sm text-amber-900 dark:text-amber-100">{value}</p>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* Template Suggestions */}
      {templateSuggestions.length > 0 && (
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800">
          <CardContent className="pt-6">
            <p className="text-sm font-semibold text-green-900 dark:text-green-200 mb-2">
              💡 Template yang Disarankan:
            </p>
            <div className="flex flex-wrap gap-2">
              {templateSuggestions.map((template) => (
                <Badge key={template} variant="outline" className="text-green-700 dark:text-green-300">
                  {template}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
