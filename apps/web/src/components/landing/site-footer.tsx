import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { menuCategories } from "@/lib/categories"
import { site } from "@/lib/site"

export function SiteFooter() {
  const { phone, email, address } = site.contact

  return (
    <footer id="contact" className="mx-auto w-full max-w-6xl scroll-mt-8 px-4 pt-16 pb-8 md:px-6 md:pt-24">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <h2 className="font-heading text-xl">Contact</h2>
          <ul className="mt-5 flex flex-col gap-4 text-sm">
            <ContactRow icon={PhoneIcon} href={`tel:${phone.replace(/[^+\d]/g, "")}`}>
              {phone}
            </ContactRow>
            <ContactRow icon={MapPinIcon}>
              {address[0]}
              <br />
              {address[1]}
            </ContactRow>
            <ContactRow icon={MailIcon} href={`mailto:${email}`}>
              {email}
            </ContactRow>
          </ul>
        </div>

        <FooterLinks title="Navigate" links={site.nav} />
        <FooterLinks
          title="Menu"
          links={menuCategories.map((c) => ({ label: c.label, href: `#${c.id}` }))}
        />
        <FooterLinks title="Follow us" links={site.socials} />
      </div>

      <Separator className="mt-12 mb-6" />
      <p className="text-sm text-muted-foreground">
        © {site.name}. All rights reserved.
      </p>
    </footer>
  )
}

function ContactRow({
  icon: Icon,
  href,
  children,
}: {
  icon: LucideIcon
  href?: string
  children: React.ReactNode
}) {
  const content = (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Icon className="size-4" />
      </span>
      <span>{children}</span>
    </>
  )

  return (
    <li>
      {href ? (
        <a href={href} className="flex items-center gap-3 hover:text-primary">
          {content}
        </a>
      ) : (
        <div className="flex items-center gap-3">{content}</div>
      )}
    </li>
  )
}

function FooterLinks({
  title,
  links,
}: {
  title: string
  links: readonly { label: string; href: string }[]
}) {
  return (
    <div>
      <h2 className="font-heading text-xl">{title}</h2>
      <ul className="mt-5 flex flex-col gap-3 text-sm">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="hover:text-primary">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
