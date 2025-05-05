import { Button } from '../ui/Button';
import { ChatButtonProps } from '../chat/ChatButtonProps';
import { cn } from '../../../lib/classNames';

export function InsurancePrompts({ isLoading, onClick }: ChatButtonProps) {
  return (
    <div className="flex flex-col items-start space-y-4">
      {/* Basic Insurance Info Section */}
      <h3 className="text-sm font-medium">Basic Insurance Info</h3>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="ghost"
          disabled={isLoading}
          onClick={() => onClick("What types of life insurance policies are available?")}
          className={cn(
            "bg-muted hover:bg-primary/5 text-foreground",
            isLoading && "cursor-not-allowed opacity-50"
          )}
        >
          Types of policies
        </Button>
        <Button
          variant="ghost"
          disabled={isLoading}
          onClick={() => onClick("What is the difference between term and whole life insurance?")}
          className={cn(
            "bg-muted hover:bg-primary/5 text-foreground",
            isLoading && "cursor-not-allowed opacity-50"
          )}
        >
          Term vs Whole Life
        </Button>
        <Button
          variant="ghost"
          disabled={isLoading}
          onClick={() => onClick("How much life insurance coverage do I need?")}
          className={cn(
            "bg-muted hover:bg-primary/5 text-foreground",
            isLoading && "cursor-not-allowed opacity-50"
          )}
        >
          Coverage amount
        </Button>
      </div>

      {/* Health Questions Section */}
      <h3 className="text-sm font-medium">Health Questions</h3>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="ghost"
          disabled={isLoading}
          onClick={() => onClick("How do pre-existing conditions affect my insurance coverage?")}
          className={cn(
            "bg-muted hover:bg-primary/5 text-foreground",
            isLoading && "cursor-not-allowed opacity-50"
          )}
        >
          Pre-existing conditions
        </Button>
        <Button
          variant="ghost"
          disabled={isLoading}
          onClick={() => onClick("Do I need to take a medical exam for life insurance?")}
          className={cn(
            "bg-muted hover:bg-primary/5 text-foreground",
            isLoading && "cursor-not-allowed opacity-50"
          )}
        >
          Medical exam
        </Button>
        <Button
          variant="ghost"
          disabled={isLoading}
          onClick={() => onClick("What health factors affect my insurance premium?")}
          className={cn(
            "bg-muted hover:bg-primary/5 text-foreground",
            isLoading && "cursor-not-allowed opacity-50"
          )}
        >
          Health factors
        </Button>
      </div>

      {/* Policy Questions Section */}
      <h3 className="text-sm font-medium">Policy Questions</h3>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="ghost"
          disabled={isLoading}
          onClick={() => onClick("What factors determine my premium cost?")}
          className={cn(
            "bg-muted hover:bg-primary/5 text-foreground",
            isLoading && "cursor-not-allowed opacity-50"
          )}
        >
          Premium costs
        </Button>
        <Button
          variant="ghost"
          disabled={isLoading}
          onClick={() => onClick("How does the claims process work?")}
          className={cn(
            "bg-muted hover:bg-primary/5 text-foreground",
            isLoading && "cursor-not-allowed opacity-50"
          )}
        >
          Claims process
        </Button>
        <Button
          variant="ghost"
          disabled={isLoading}
          onClick={() => onClick("Can I modify my policy after purchase?")}
          className={cn(
            "bg-muted hover:bg-primary/5 text-foreground",
            isLoading && "cursor-not-allowed opacity-50"
          )}
        >
          Policy modifications
        </Button>
      </div>
    </div>
  );
}
