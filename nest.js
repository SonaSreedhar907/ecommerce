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
function organizeTasks(tasks, parentId = 0) {
  const nestedTasks = [];
  tasks
      .filter(task =>task.parentID === parentId)
      .sort((a, b) => {
        a.index - b.index
      })
      .forEach(task => {
          const children = organizeTasks(tasks, task.id);
          if (children.length > 0) {
              task.child = children;
          }
          nestedTasks.push(task);
      });
  return nestedTasks;
}
console.log(JSON.stringify(organizeTasks(tasks)))








// function compare(a, b) {
//     const index1 = a.index;
//     const index2 = b.index;
  
//     let comparison = 0;
//     if (index1 > index2) {
//       comparison = 1;
//     } else if (index1 < index2) {
//       comparison = -1;
//     }
//     return comparison;
//   }
// const tasks=bv.sort(compare)




// function buildHierarchy(b) {
//   const a = [];
//   b.forEach((task) => {
//     if (task.parentID === 0) {
//       a.push({ ...task, child: [] });
//     } else {
//       a.forEach((z) => {
//         if (z.id === task.index) {
//           z.child.push({ ...task, child: [] });
//         }
//       });
//       a.forEach((f) => {
//         f.child.forEach((n) => {
//           if (n.id === task.index) {
//             n.child.push({ ...task });
//           }
//         });
//       });
//     }
//   });
//   return a;
// }
// console.log(JSON.stringify(buildHierarchy(b)));







// function recursion(b) {
//   const a = [];
//   const addToValues = (node, b) => {
//     b.forEach(task => {
//       if (node.id == task.index) {
//         const childNode = { ...task, child: [] };
//         node.child.push(childNode);
//       }
//     });
// };

//   b.forEach(task => {
//     if (task.parentID === 0) {
//       const rootNode = { ...task, child: [] };
//       addToValues(rootNode, b);
//       a.push(rootNode);
//     }
//   });
//   return a;
// }

// console.log(JSON.stringify(recursion(b)))






// function recursion(b) {
//   const a = [];

//   const addToValues = (node, tasks) => {
//     tasks.forEach(task => {
//       if (node.id == task.index) {
//         const childNode = { ...task, child: [] };
//         node.child.push(childNode);
//       }
//     });
//   };
//   b.forEach(task => {
//     if (task.parentID === 0) {
//       const rootNode = { ...task, child: [] };
//       addToValues(rootNode, b);
//       a.push(rootNode);
//     }
//   });

//   return a;
// }
// console.log(JSON.stringify(recursion(b)))


// function recursion(b){
//   const a=[]
//   const addToValues=(node,b)=>{
//     b.forEach((task)=>{
//       if(node.id == task.index){
//         const childNode = {...task,child:[]}
      
//         node.child.push(childNode)
//       }
//     })
//     addToValues(childNode,task)
//   }
//   b.forEach(task => {
//     if(task.parentID == 0){
//       const rootNode= {...task,child:[]}
//       addToValues(rootNode,b)
//       a.push(rootNode)
//     }
//   });
// return a
// }
// console.log(JSON.stringify(recursion(b)))





