import { useState, useEffect } from 'react';
import { BlockData, BLOCK_REGISTRY, createBlock } from '@/types/blocks';
import { BlockEditor } from './BlockEditors';
import { renderBlock } from './BlockRenderers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Trash2, Copy, Eye, EyeOff, GripVertical, ChevronUp, ChevronDown,
  Zap, Grid, MessageSquare, Package, HelpCircle, Mail, Type
} from 'lucide-react';
import { toast } from 'sonner';

interface VisualBlockBuilderProps {
  blocks: BlockData[];
  onBlocksChange: (blocks: BlockData[]) => void;
}

const BLOCK_ICONS: Record<string, React.ReactNode> = {
  hero: <Zap className="h-4 w-4" />,
  features: <Grid className="h-4 w-4" />,
  testimonials: <MessageSquare className="h-4 w-4" />,
  packages: <Package className="h-4 w-4" />,
  faq: <HelpCircle className="h-4 w-4" />,
  contact: <Mail className="h-4 w-4" />,
  richtext: <Type className="h-4 w-4" />,
};

export function VisualBlockBuilder({ blocks, onBlocksChange }: VisualBlockBuilderProps) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  const addBlock = (blockType: keyof typeof BLOCK_REGISTRY) => {
    const newBlock = createBlock(blockType);
    newBlock.order = blocks.length;
    const updatedBlocks = [...blocks, newBlock];
    onBlocksChange(updatedBlocks);
    setSelectedBlockId(newBlock.id);
    toast.success(`Blok ${BLOCK_REGISTRY[blockType].label} ditambahkan`);
  };

  const updateBlock = (updatedBlock: BlockData) => {
    const updatedBlocks = blocks.map(b => b.id === updatedBlock.id ? updatedBlock : b);
    onBlocksChange(updatedBlocks);
  };

  const deleteBlock = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus blok ini?')) {
      const updatedBlocks = blocks.filter(b => b.id !== id);
      onBlocksChange(updatedBlocks);
      if (selectedBlockId === id) {
        setSelectedBlockId(updatedBlocks.length > 0 ? updatedBlocks[0].id : null);
      }
      toast.success('Blok dihapus');
    }
  };

  const duplicateBlock = (id: string) => {
    const blockToDuplicate = blocks.find(b => b.id === id);
    if (blockToDuplicate) {
      const newBlock: BlockData = {
        ...JSON.parse(JSON.stringify(blockToDuplicate)),
        id: `block-${Date.now()}`,
        order: blocks.length,
      };
      const updatedBlocks = [...blocks, newBlock];
      onBlocksChange(updatedBlocks);
      setSelectedBlockId(newBlock.id);
      toast.success('Blok diduplikasi');
    }
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(b => b.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === blocks.length - 1)) {
      return;
    }

    const updatedBlocks = [...blocks];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [updatedBlocks[index], updatedBlocks[newIndex]] = [updatedBlocks[newIndex], updatedBlocks[index]];

    // Update order
    updatedBlocks.forEach((block, idx) => {
      block.order = idx;
    });

    onBlocksChange(updatedBlocks);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = blocks.findIndex(b => b.id === draggedId);
    const targetIndex = blocks.findIndex(b => b.id === targetId);

    const updatedBlocks = [...blocks];
    [updatedBlocks[draggedIndex], updatedBlocks[targetIndex]] = [updatedBlocks[targetIndex], updatedBlocks[draggedIndex]];

    updatedBlocks.forEach((block, idx) => {
      block.order = idx;
    });

    onBlocksChange(updatedBlocks);
    setDraggedId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Visual Block Builder</h3>
          <p className="text-sm text-muted-foreground">Buat halaman dengan menyeret dan mengedit blok</p>
        </div>
        <Button
          variant={previewMode ? 'default' : 'outline'}
          onClick={() => setPreviewMode(!previewMode)}
          className="gap-2"
        >
          {previewMode ? (
            <>
              <EyeOff className="h-4 w-4" />
              Edit Mode
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              Preview
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="blocks" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="blocks">Blok ({blocks.length})</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* Blocks Tab */}
        <TabsContent value="blocks" className="space-y-4">
          {/* Available Blocks */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tambah Blok</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {Object.entries(BLOCK_REGISTRY).map(([key, definition]) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => addBlock(key as any)}
                    className="flex flex-col items-center gap-1 h-auto py-3"
                  >
                    {BLOCK_ICONS[key]}
                    <span className="text-xs text-center">{definition.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Blocks List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Urutan Blok</CardTitle>
            </CardHeader>
            <CardContent>
              {blocks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Belum ada blok. Tambahkan blok untuk memulai.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {blocks.map((block, idx) => {
                    const definition = BLOCK_REGISTRY[block.type];
                    const isSelected = selectedBlockId === block.id;

                    return (
                      <div
                        key={block.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, block.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, block.id)}
                        onClick={() => setSelectedBlockId(block.id)}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-move transition-colors ${
                          isSelected
                            ? 'bg-primary/10 border-primary'
                            : 'hover:bg-muted/50 border-border'
                        }`}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {BLOCK_ICONS[block.type]}
                            <span className="font-medium text-sm">{definition.label}</span>
                            <Badge variant="secondary" className="text-xs">
                              #{idx + 1}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {block.content.title || block.content.html?.substring(0, 50) || 'Tanpa judul'}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveBlock(block.id, 'up');
                            }}
                            disabled={idx === 0}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveBlock(block.id, 'down');
                            }}
                            disabled={idx === blocks.length - 1}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateBlock(block.id);
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteBlock(block.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Block Editor */}
          {selectedBlock && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {BLOCK_ICONS[selectedBlock.type]}
                  Edit: {BLOCK_REGISTRY[selectedBlock.type].label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BlockEditor block={selectedBlock} onChange={updateBlock} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {blocks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Belum ada blok untuk ditampilkan. Tambahkan blok untuk melihat preview.</p>
                </div>
              ) : (
                <div className="space-y-6 border-t pt-6">
                  {blocks.map((block) => (
                    <div
                      key={block.id}
                      className="border rounded-lg overflow-hidden"
                      dangerouslySetInnerHTML={{
                        __html: renderBlock(block),
                      }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
