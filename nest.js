const tasks = [
  {
    id: 1,
    index: 0,
    name: "task 1",
    parentID: 0,
  },
  {
    id: 3,
    index: 2,
    name: "task 3",
    parentID: 2,
  },
  {
    id: 2,
    index: 1,
    name: "task 2",
    parentID: 1,
  },
  {
    id: 5,
    index: 4,
    name: "task 5",
    parentID: 4,
  },
  {
    id: 4,
    index: 3,
    name: "task 4",
    parentID: 0,
  },
  {
    id: 6,
    index: 5,
    name: "task 6",
    parentID: 4,
  },
];


// function problem(tasks){
//     // const root=[]
//     const taskMap = tasks.reduce((acc,task)=>{
//         acc[task.id]={...task,child:[]}
//         return acc
//     },{})
//     tasks.forEach(task => {
//         const parenttask = taskMap[task.parentID]
//         if(parenttask){
//            parenttask.child.push(taskMap[task.id])
//         }else{
//             root.push(taskMap[task.id])
//         }
//     });
//    return taskMap
// }
// console.log(JSON.stringify(problem(tasks)))



function problem(tasks,parentID=0){
    const node=[]
   tasks.forEach(task => {
    if(task.parentID == parentID){
        task.forEach(task)
      const a=problem(tasks,task.id)
      if(a.length>0){
       task.child=a
      }
    }
    node.push(task)
   });
   return node
}
var z= problem(tasks)
console.log(JSON.parse())


// function organizeTasks(tasks, parentId = 0) {
//     const nestedTasks = [];

//     tasks
//         .filter(task => task.parentID === parentId)
//         .sort((a, b) => a.index - b.index)
//         .forEach(task => {
//             const children = organizeTasks(tasks, task.id);
//             if (children.length > 0) {
//                 task.child = children;
//             }
//             nestedTasks.push(task);
//         });

//     return nestedTasks;
// }