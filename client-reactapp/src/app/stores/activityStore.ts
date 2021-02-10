import { makeAutoObservable, configure, runInAction } from "mobx";
import { createContext, SyntheticEvent } from "react";
import { IActivity } from "../models/activity";
import agent from "../api/agent";

//configure({ enforceActions: "always" });

configure({
  enforceActions: "always",
  computedRequiresReaction: true,
  reactionRequiresObservable: true,
  observableRequiresReaction: true,
  disableErrorBoundaries: true,
});

class ActivityStore {
  activityRegistry = new Map();
  activity: IActivity | null = null;
  loadingInitial = false;
  submitting = false;
  target = "";

  get activitiesByDate() {
    return this.groupActivitiesByDate(
      Array.from(this.activityRegistry.values())
    );
    // return Array.from(this.activityRegistry.values()).sort(
    //   (a, b) => Date.parse(a.date) - Date.parse(b.date)
    // );
    // return this.activities
    //   .slice()
    //   .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  }

  private groupActivitiesByDate(activities: IActivity[]) {
    const sortedActivities = activities.sort(
      (a, b) => Date.parse(a.date) - Date.parse(b.date)
    );

    return Object.entries(sortedActivities.reduce((activities, activity) => {
      const date = activity.date.split('T')[0];
      activities[date] = activities[date] ? [...activities[date], activity] : [activity];
      return activities;
    }, {} as {[key: string]: IActivity[]}));
  }

  constructor() {
    makeAutoObservable(this);
  }

  loadActivities = async () => {
    this.loadingInitial = true;
    try {
      const activities = await agent.Activities.list();
      runInAction(() => {
        activities.forEach((activity) => {
          activity.date = activity.date.split(".")[0];
          this.activityRegistry.set(activity.id, activity);
          //this.activities.push(activity);
        });
        this.loadingInitial = false;
      });
      console.log(this.groupActivitiesByDate(activities));
    } catch (error) {
      runInAction(() => {
        this.loadingInitial = false;
      });
      console.log(error);
    }
  };

  loadActivity = async (id: string) => {
    let activity = this.getActivity(id);
    if (activity) {
      this.activity = activity;
    } else {
      this.loadingInitial = true;
      try {
        activity = await agent.Activities.details(id);
        runInAction(() => {
          this.activity = activity;
          this.loadingInitial = false;
        });
      } catch (error) {
        runInAction(() => {
          this.loadingInitial = false;
        });
        console.log(error);
      }
    }
  };

  clearActivity = () => {
    this.activity = null;
  };

  private getActivity = (id: string) => {
    return this.activityRegistry.get(id);
  };

  createActivity = async (activity: IActivity) => {
    this.submitting = true;
    try {
      await agent.Activities.create(activity);
      runInAction(() => {
        this.activityRegistry.set(activity.id, activity);
        //this.activities.push(activity);
        //this.editMode = false;
        this.submitting = false;
      });
    } catch (error) {
      runInAction(() => {
        this.submitting = false;
      });
      console.log(error);
    }
  };

  editActivity = async (activity: IActivity) => {
    this.submitting = true;
    try {
      await agent.Activities.update(activity);
      runInAction(() => {
        this.activityRegistry.set(activity.id, activity);
        this.activity = activity;
        //this.editMode = false;
        this.submitting = false;
      });
    } catch (error) {
      runInAction(() => {
        this.submitting = false;
      });
      console.log(error);
    }
  };

  deleteActivity = async (
    event: SyntheticEvent<HTMLButtonElement>,
    id: string
  ) => {
    this.submitting = true;
    this.target = event.currentTarget.name;
    try {
      await agent.Activities.delete(id);
      runInAction(() => {
        this.activityRegistry.delete(id);
        this.submitting = false;
        this.target = "";
      });
    } catch (error) {
      runInAction(() => {
        this.submitting = false;
        this.target = "";
      });
      console.log(error);
    }
  };

  openCreateForm = () => {
    //this.editMode = true;
    this.activity = null;
  };

  openEditForm = (id: string) => {
    this.activity = this.activityRegistry.get(id);
    //this.editMode = true;
  };

  // cancelSelectedActivity = () => {
  //   this.activity = null;
  // };

  // cancelFormOpen = () => {
  //   this.editMode = false;
  // };

  // selectActivity = (id: string) => {
  //   this.activity = this.activityRegistry.get(id);
  //   //this.selectedActivity = this.activities.find((a) => a.id === id);
  //   this.editMode = false;
  // };
}

export default createContext(new ActivityStore());

// import { action, observable, makeObservable } from "mobx";
// import { createContext } from "react";
// import { IActivity } from "../models/activity";
// import agent from "../api/agent";

// class ActivityStore {
//   @observable activities: IActivity[] = [];
//   @observable loadingInitial = false;

//     constructor() {
//         makeObservable(this);
//     }

//   @action loadActivities = () => {
//     this.loadingInitial = true;
//     agent.Activities.list()
//       .then((activities) => {
//         activities.forEach((activity) => {
//           activity.date = activity.date.split(".")[0];
//           this.activities.push(activity);
//         });
//       })
//       .finally(() => (this.loadingInitial = false));
//   };
// }

// export default createContext(new ActivityStore());
