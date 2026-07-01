import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClockAlert, FileWarningIcon, MoveRight } from "lucide-react";
import Link from "next/link";

export default function DamageExpire() {
  return (
    <div>
      <Tabs
        className="w-full flex items-center justify-center"
        defaultValue="report"
      >
        <TabsList variant="line">
          <TabsTrigger value="report" className="text-2xl font-bold">
            Report
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-2xl font-bold">
            Pending
          </TabsTrigger>
        </TabsList>

        <TabsContent value="report" className="mt-10">
          <div className="flex flex-col gap-4">
            <Link href="/expire-damage/damage" className="group">
              <Card className="rounded-xl border bg-card hover:border-primary hover:bg-accent/30 transition-all cursor-pointer">
                <CardContent className="flex w-full px-8 sm:w-sm md:w-md h-20 flex-col items-center justify-center gap-2">
                  <div className="flex gap-1">
                    <FileWarningIcon />
                    <p className="text-lg font-medium">Damage Report</p>
                  </div>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    Submit a damage report
                    <span className="transition-transform duration-200 group-hover:translate-x-1">
                      <MoveRight size={14} />
                    </span>
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href="expire-damage/expire" className="group">
              <Card className="rounded--xl border bg-card hover:border-primary hover:bg-accent/30 transition-all cursor-pointer">
                <CardContent className="flex w-full px-8 sm:w-sm md:w-md h-20 flex-col items-center justify-center gap-2">
                  <div className="flex gap-1">
                    <ClockAlert />
                    <p className="text-lg font-medium">Expired Report</p>
                  </div>
                  <p className="flex gap-1 items-center text-sm text-muted-foreground">
                    Submit an expired report
                    <span className="transition-transform duration-200 group-hover:translate-x-1">
                      <MoveRight size={14} />
                    </span>
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
