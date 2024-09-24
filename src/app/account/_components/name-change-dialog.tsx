"use client";

// LIBS
import { type Session } from "next-auth";
import { useState } from "react";

// UTILS
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

// COMPONENTS
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { DivedToast } from "~/components/ui/toast";
import { useToast } from "~/components/ui/use-toast";

// COMP
const NameChangeDialog = ({
  session,
}: {
  session: Session | null | undefined;
}) => {
  const [mouseOver, setMouseOver] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [nameInput, setNameInput] = useState(
    session?.user?.name ? session.user.name : "",
  );

  const editUser = api.users.edit.useMutation({
    onSuccess: () => {
      router.refresh();
      setOpen(false);
      toast({
        action: (
          <DivedToast type="success">{"Name has been changed!"}</DivedToast>
        ),
      });
    },
    onError: (error) => {
      toast({
        action: (
          <DivedToast type="error">{`Error: ${error.message}`}</DivedToast>
        ),
      });
    },
  });

  const handleNameChange = () => {
    editUser.mutate({ name: nameInput });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div
          // NAME
          className="flex cursor-pointer items-center gap-8"
          onMouseEnter={() => setMouseOver(true)}
          onMouseLeave={() => setMouseOver(false)}
        >
          <div
            className={cn(
              "border-b-4 border-transparent pb-3 text-2xl font-bold tracking-wider text-foreground",
              mouseOver ? "border-accent" : "",
            )}
          >
            {session?.user?.name}
          </div>
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>Change Name</DialogHeader>
        <div className="flex gap-6">
          <Input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
          />
          <Button onClick={handleNameChange}>Change Name</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default NameChangeDialog;
