# Low Level Design


You can try running below command, if your `cloudformation` stack stucking around `UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS` state.


```bash
aws cloudformation delete-stack \
    --stack-name <cdk_stack_name>
```