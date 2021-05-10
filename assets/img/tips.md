# Useful Tips

Document intended to guide contributors more fluent experience. Some of the `hints` has been given to simplify implementation of the project


You can try running below command, if your `cloudformation` stack stucking around `UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS` state.


```bash
aws cloudformation delete-stack \
    --stack-name <cdk_stack_name>
```