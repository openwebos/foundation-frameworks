Random ideas about Foundations.IO:
-I was thinking about passing {bufferList: bufferList, <custom/specific output name>: <specific output> } where the customized output is something like an IOChannel or Curl object, but i believe this is inappropriate. If an app needs to work on the 'specific output', it can chain them along the onSuccess or subclass a chainlink to handle it specifically. It could also pass the customized output in the normal output array, and have the next chain link handle it appropriately.
-if a chain link passes a non-buffer array as output or if it is a tail, provide a way to 'recycle' these buffer objects back to the previous links. remove and recycle buffer objects after they are completed... 
-for handling of errors, by default, chain links should probably pause and cleanup if there is an exception in any of the links and no error handlers.
-need way for progress to be reported... it is unclear that the last link's progress is always what's desired and how to compare it against 'progress left'...

Some Implementation Details:
if handleInput's callback is passed something falsey, it's assumed that the link has handled it, but has no output to pass onwards at the time.
A chain link has an 'input' and 'output' queue. The input queue contains input that has not been processed yet by the current link. The output queue contains completed output that hasn't been sent out yet. The input queue grows in length and the output queue is frozen when the given link is paused.  
The output queue is necessary to support output from asynchronous operations that don't necessarily guarantee order -- like if a link took a list of URLs, and outputted the contents. The output queue won't pass output on if output hasn't completed for a previous input.
'done' is truthy on the last input to a chain link. I dislike that it's not really a cleanly enforced break in input. It's also a little weird that it's on an array.
