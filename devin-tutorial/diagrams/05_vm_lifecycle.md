# Diagram 5: Firecracker MicroVM Lifecycle & Warm Pools

```mermaid
stateDiagram-v2
    [*] --> GoldenSnapshot: Build Rootfs & Kernel
    GoldenSnapshot --> WarmPool: Pre-boot VM & Save (mem.snap + vm.snap)
    
    state WarmPool {
        [*] --> Filling: Background Goroutine
        Filling --> ReadyQueue: launcher.Restore() + paused start
        ReadyQueue --> Checked: Health check /health OK
    }
    
    Checked --> Assigned: takeWarm() pops instance
    WarmPool --> ColdProvision: Pool empty / Miss
    ColdProvision --> Assigned: launcher.Restore() in goroutine
    
    state RunningVM {
        Assigned --> COWClone: cp --reflink=auto rootfs.ext4
        COWClone --> DriveRebind: machine.UpdateGuestDrive()
        DriveRebind --> Resumed: machine.ResumeVM()
        Resumed --> ActiveWork: Execute shell / git / files
    }
    
    ActiveWork --> Terminating: Task completed / failed / cancelled
    
    state TeardownCleanup {
        Terminating --> StopVMM: machine.StopVMM() halts VM
        StopVMM --> ReleaseCNI: cnihelper.Delete() drops TAP
        ReleaseCNI --> DeleteRootfs: os.RemoveAll(vmDir)
        DeleteRootfs --> FlushConntrack: cnihelper.FlushGuestConntrack()
    }
    
    FlushConntrack --> [*]
```

---

### State Transitions & Pool Management Explanation

A state machine showing how golden rootfs images and snapshot states (`mem.snap` and `vm.snap`) are generated, kept in a pre-booted warm pool, cloned via copy-on-write reflinks upon assignment, actively managed during task execution, and cleanly dismantled during teardown.

---

### What to Say While Showing This

- *"Firecracker MicroVMs boot cold in about 1 second, but Devin takes this further with snapshotting."*
- *"We pre-boot a VM, let it configure its network, and take a memory snapshot. In the background, the manager holds a warm pool of pre-restored VMs."*
- *"When a task arrives, we clone the golden root filesystem using XFS reflink pointers — copy-on-write takes roughly 28 milliseconds with zero disk duplication."*
- *"When the session ends, the VMM process terminates, the TAP device is torn down, the cloned disk is wiped, and conntrack tables are flushed."*
