"use client"

import * as React from "react"
import { ImageUpIcon, LinkIcon, UploadIcon } from "lucide-react"
import { isPhotoLink, type AdminProduct, type MealCategory, type ProductRequest } from "@ndutas/core"
import { toast } from "sonner"
import { ProductImage } from "@/components/product-image"
import { SpinnerCustom } from "@/components/spinner-custom"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useMediaQuery } from "@/hooks/use-media-query"
import { menuCategories } from "@/lib/categories"
import { formatBytes, MAX_PHOTO_SIDE, PhotoError, shrinkImage } from "@/lib/shrink-image"
import { cn } from "@/lib/utils"
import { useProductsStore } from "./products-store"

const empty: ProductRequest = { name: "", description: "", price: 0, image: "", category: "breakfast" }

type PhotoSource = "upload" | "link"
type UploadState = { status: "idle" } | { status: "working"; step: string } | { status: "done"; note: string }

// Add or edit a menu item (owner only). The same vaul drawer as the cart and order details:
// from the right on desktop, from the bottom on phones. `product` null means a new one.
export function ProductDrawer({
  open,
  onOpenChange,
  product,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: AdminProduct | null
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const save = useProductsStore((state) => state.save)
  const [draft, setDraft] = React.useState<ProductRequest>(empty)
  const [price, setPrice] = React.useState("")
  const [source, setSource] = React.useState<PhotoSource>("upload")
  const [upload, setUpload] = React.useState<UploadState>({ status: "idle" })
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)
  const [editing, setEditing] = React.useState<string | null | undefined>(undefined)

  // Reset the form whenever a different product (or "new") is opened.
  const key = product?.id ?? null
  if (open && editing !== key) {
    setEditing(key)
    setDraft(product ? { ...product } : empty)
    setPrice(product ? String(product.price) : "")
    setSource("upload")
    setUpload({ status: "idle" })
    setError(null)
  }
  if (!open && editing !== undefined) setEditing(undefined)

  function update<K extends keyof ProductRequest>(field: K, value: ProductRequest[K]) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  async function uploadFile(file: File) {
    setError(null)
    try {
      setUpload({ status: "working", step: "Shrinking the photo…" })
      const photo = await shrinkImage(file)
      setUpload({ status: "working", step: "Uploading…" })
      const url = await useProductsStore.getState().uploadPhoto(photo)
      update("image", url)
      setUpload({
        status: "done",
        note: `Saved as ${formatBytes(photo.size)} ${photo.type === "image/webp" ? "WebP" : "JPEG"} (was ${formatBytes(file.size)})`,
      })
    } catch (failure) {
      setUpload({ status: "idle" })
      setError(
        failure instanceof PhotoError || failure instanceof Error ? failure.message : "Couldn't upload the photo."
      )
    }
  }

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft.image.trim()) {
      setError("Add a photo: upload one or paste a link.")
      return
    }
    setPending(true)
    setError(null)
    try {
      const saved = await save(product?.id ?? null, { ...draft, price: Number(price) })
      toast.success(product ? `${saved.name} updated` : `${saved.name} added to the menu`)
      onOpenChange(false)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Couldn't save the product.")
    } finally {
      setPending(false)
    }
  }

  const busy = pending || upload.status === "working"
  const preview = isPhotoLink(draft.image.trim()) ? draft.image.trim() : null

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => !busy && onOpenChange(next)}
      direction={isDesktop ? "right" : "bottom"}
    >
      <DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-md">
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <DrawerHeader className="border-b border-border text-left">
            <DrawerTitle className="font-heading text-xl">{product ? "Edit product" : "Add a product"}</DrawerTitle>
            <DrawerDescription>Changes show on the menu within a few seconds.</DrawerDescription>
          </DrawerHeader>

          <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="product-name">Name</Label>
              <Input
                id="product-name"
                value={draft.name}
                onChange={(e) => update("name", e.target.value)}
                maxLength={60}
                required
                className="h-10"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                value={draft.description}
                onChange={(e) => update("description", e.target.value)}
                maxLength={160}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="product-price">Price (Ksh)</Label>
                <Input
                  id="product-price"
                  inputMode="numeric"
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  className="h-10 font-price tabular-nums"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product-category">Category</Label>
                <Select value={draft.category} onValueChange={(value) => update("category", value as MealCategory)}>
                  <SelectTrigger id="product-category" className="h-10 w-full cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {menuCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id} className="cursor-pointer">
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Photo</Label>
                <Tabs value={source} onValueChange={(value) => setSource(value as PhotoSource)}>
                  <TabsList className="h-8">
                    <TabsTrigger value="upload" className="cursor-pointer text-xs">
                      <UploadIcon data-icon="inline-start" />
                      Upload
                    </TabsTrigger>
                    <TabsTrigger value="link" className="cursor-pointer text-xs">
                      <LinkIcon data-icon="inline-start" />
                      Paste link
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {source === "upload" ? (
                <PhotoDropzone disabled={busy} upload={upload} onFile={(file) => void uploadFile(file)} />
              ) : (
                <Input
                  id="product-image"
                  type="url"
                  value={draft.image}
                  onChange={(e) => update("image", e.target.value)}
                  placeholder="https://…"
                  aria-label="Photo link"
                  className="h-10"
                />
              )}

              {preview && (
                <div className="relative mt-1 aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-muted">
                  <ProductImage src={preview} alt="Preview" fill sizes="400px" className="object-cover" />
                </div>
              )}
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          <DrawerFooter className="grid grid-cols-2 gap-2 border-t border-border">
            <DrawerClose asChild>
              <Button type="button" variant="outline" className="cursor-pointer rounded-full" disabled={busy}>
                Cancel
              </Button>
            </DrawerClose>
            <Button type="submit" className="cursor-pointer rounded-full" disabled={busy}>
              {pending && <SpinnerCustom data-icon="inline-start" />}
              {product ? "Save" : "Add product"}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}

// Click or drop a photo. It's shrunk in the browser before upload (see shrink-image.ts).
function PhotoDropzone({
  disabled,
  upload,
  onFile,
}: {
  disabled: boolean
  upload: UploadState
  onFile: (file: File) => void
}) {
  const inputId = React.useId()
  const [over, setOver] = React.useState(false)

  return (
    <label
      htmlFor={inputId}
      onDragOver={(event) => {
        event.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault()
        setOver(false)
        const file = event.dataTransfer.files[0]
        if (file && !disabled) onFile(file)
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-dashed border-foreground/25 px-4 py-5 text-center text-sm transition-colors hover:border-primary hover:bg-primary/5",
        over && "border-primary bg-primary/5",
        disabled && "pointer-events-none opacity-70"
      )}
    >
      {upload.status === "working" ? (
        <>
          <SpinnerCustom className="size-5 text-primary" />
          <span className="font-medium">{upload.step}</span>
        </>
      ) : (
        <>
          <ImageUpIcon className="size-6 text-primary" strokeWidth={1.5} />
          <span className="font-medium">{upload.status === "done" ? "Replace photo" : "Choose or drop a photo"}</span>
          <span className="text-xs text-muted-foreground">
            {upload.status === "done"
              ? upload.note
              : `JPEG, PNG or WebP. Shrunk to ${MAX_PHOTO_SIDE}px before upload to save space.`}
          </span>
        </>
      )}
      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ""
          if (file) onFile(file)
        }}
      />
    </label>
  )
}
