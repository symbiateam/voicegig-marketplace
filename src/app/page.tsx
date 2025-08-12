import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Navigation } from '@/components/navigation'
import {
  Mic2,
  DollarSign,
  Upload,
  Clock,
  Users,
  PlayCircle,
  CheckCircle,
  Star,
  ArrowRight
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />

      {/* Hero Section */}
      <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
        <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <Badge variant="outline" className="rounded-full px-4 py-1.5">
            Voice/Video Marketplace
          </Badge>
          <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
            Turn Your Voice Into
            <br className="hidden sm:inline" />
            <span className="text-primary"> Income</span>
          </h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            Liva connects talented voice actors with clients who need professional audio and video recordings.
            Find freelance work, submit your recordings, and get paid securely.
          </p>
          <div className="space-x-4">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start Earning Today
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="#how-it-works">
                <PlayCircle className="mr-2 h-4 w-4" />
                See How It Works
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container space-y-6 bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-24">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
            Features
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Everything you need to succeed as a voice actor or content creator.
          </p>
        </div>
        <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
          <Card>
            <CardHeader>
              <Upload className="h-10 w-10 text-primary" />
              <CardTitle>Easy File Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Upload audio and video files with drag-and-drop support. Preview your work before submission.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <DollarSign className="h-10 w-10 text-primary" />
              <CardTitle>Secure Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get paid instantly through Stripe Connect. Track your earnings and request payouts anytime.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Clock className="h-10 w-10 text-primary" />
              <CardTitle>Real-time Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Stay updated on job status, submissions, and earnings with real-time notifications.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-primary" />
              <CardTitle>Quality Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Work with verified clients who value professional voice work and pay fair rates.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Mic2 className="h-10 w-10 text-primary" />
              <CardTitle>Pro Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Professional recording tools and quality guidelines to help you deliver your best work.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Star className="h-10 w-10 text-primary" />
              <CardTitle>Build Your Reputation</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Earn ratings and build a portfolio that attracts higher-paying opportunities.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="container space-y-6 py-8 md:py-12 lg:py-24">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
            How It Works
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Getting started is simple. Sign up, browse jobs, submit your work, and get paid.
          </p>
        </div>
        <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-4">
          <div className="relative flex flex-col items-center space-y-2 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white text-2xl font-bold">
              1
            </div>
            <h3 className="text-xl font-bold">Sign Up</h3>
            <p className="text-sm text-muted-foreground">
              Create your account and complete your profile setup.
            </p>
          </div>
          <div className="relative flex flex-col items-center space-y-2 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white text-2xl font-bold">
              2
            </div>
            <h3 className="text-xl font-bold">Browse Jobs</h3>
            <p className="text-sm text-muted-foreground">
              Find voice work that matches your skills and interests.
            </p>
          </div>
          <div className="relative flex flex-col items-center space-y-2 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white text-2xl font-bold">
              3
            </div>
            <h3 className="text-xl font-bold">Submit Work</h3>
            <p className="text-sm text-muted-foreground">
              Upload your audio or video recordings for review.
            </p>
          </div>
          <div className="relative flex flex-col items-center space-y-2 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white text-2xl font-bold">
              4
            </div>
            <h3 className="text-xl font-bold">Get Paid</h3>
            <p className="text-sm text-muted-foreground">
              Receive payments instantly after your work is approved.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container space-y-6 py-8 md:py-12 lg:py-24">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center gap-4 text-center">
          <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
            Ready to Start Earning?
          </h2>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            Join thousands of voice actors already earning money with VoiceGig.
          </p>
          <div className="space-x-4">
            <Button size="lg" asChild>
              <Link href="/signup">
                Create Free Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <Mic2 className="h-6 w-6" />
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              Built for voice actors and content creators. © 2024 VoiceGig.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
