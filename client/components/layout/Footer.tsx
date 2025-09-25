export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} CivicBot. All rights reserved.</p>
        <div className="text-sm text-muted-foreground flex gap-4">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Contact</span>
        </div>
      </div>
    </footer>
  );
}
