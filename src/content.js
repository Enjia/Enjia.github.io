export const primaryEssaySlug = 'cuda';

export const seriesNavigation = [
  {
    slug: 'cuda',
    title: 'The Thread Atlas',
    subtitle: 'A CUDA field guide to threads, memory, and synchronization',
    status: 'current essay'
  },
  {
    slug: 'matmul',
    title: 'The Tile Loom',
    subtitle: 'A story of reuse, shared memory, and matrix multiplication',
    status: 'next essay'
  },
  {
    slug: 'compiler',
    title: 'The Tensor Mill',
    subtitle: 'A tour through tensor IR, lowering, and schedules',
    status: 'planned'
  },
  {
    slug: 'tilelang',
    title: 'The TileLang Forge',
    subtitle: 'A workshop for writing tile-shaped kernels',
    status: 'planned'
  }
];

export const reviewIntervals = ['in-text', '5 days', '2 weeks', '1 month', '2 months', 'long-term'];

export const essays = [
  {
    slug: 'cuda',
    title: 'The Thread Atlas',
    subtitle: 'A CUDA field guide to threads, memory, and synchronization',
    author: 'Mnemonic Medium Lab',
    deckDescription:
      'A discovery-style CUDA essay about threads, memory, synchronization, and measurement. The goal is to build durable intuition through small predictions and visible failure modes.',
    sections: [
      {
        type: 'paragraph',
        kicker: 'Opening question',
        text:
          'Start with two tiny CUDA kernels that both “just copy floats.” One lets neighboring lanes read neighboring addresses; the other makes each lane jump through memory with a large stride. Same data type, same output size, same GPU. Why can one index expression make the memory system behave as if the machine changed underneath you?'
      },
      {
        type: 'paragraph',
        text:
          'A second small shock: a reduction kernel can produce different answers on different runs, even when every thread executes the same source code. This essay is about explaining those two phenomena before we touch tiled matrix multiplication. We will use vector add, strided copy, and a deliberately broken reduction as small artifacts. Matrix multiplication waits for the next essay because it asks the reader to combine too many ideas at once.'
      },
      {
        type: 'paragraph',
        text:
          'The method is deliberately narrow. We will look at one small kernel, make a prediction, inspect the consequence, and then keep only the part of the model that survived contact with the evidence. CUDA becomes less mysterious when each concept is attached to a visible failure mode: the wrong element, the wrong lane neighborhood, the wrong memory distance, or the wrong moment in time.'
      },
      {
        type: 'paragraph',
        text:
          'Keep three questions nearby as you read. Who owns this piece of data? What are neighboring lanes doing together? What ordering has the program actually guaranteed? Most of the cards will rehearse precise answers, but the prose is here to make those questions feel natural before they become definitions.'
      },
      {
        type: 'reviewSet',
        title: 'Kernel execution basics',
        intro: 'Start with deliberately simple cards. They teach the interaction and make the execution roles fluent.',
        feedback:
          'If this felt fuzzy, separate the two worlds: host code configures work and moves data; device code is the kernel body executed by many GPU threads.',
        cards: [
          {
            id: 'cuda.kernel.device_execution',
            prompt: 'CUDA kernel function bodies mainly execute on the CPU or the GPU?',
            answer: 'On the GPU. The CPU launches kernels and coordinates host-side work.'
          },
          {
            id: 'cuda.host.role',
            prompt: 'Name one job the host CPU still does in a CUDA program.',
            answer: 'It can allocate/copy memory, configure and launch kernels, check errors, and synchronize with device work.'
          },
          {
            id: 'cuda.kernel.not_magic',
            prompt: 'Why is “the kernel runs” not enough evidence that it uses the GPU well?',
            answer: 'Correct execution does not imply efficient parallelism, good memory access, or enough work to amortize launch and transfer overheads.'
          },
          {
            id: 'cuda.performance.context',
            prompt: 'Why should CUDA performance claims include hardware and input size?',
            answer: 'Because bandwidth, cache behavior, occupancy, launch overhead, and tensor-core availability depend on the GPU and problem size.'
          },
          {
            id: 'cuda.kernel.transfer.cpu_loop',
            kind: 'transfer',
            prompt: 'You see a CPU for-loop and a CUDA kernel that both compute `out[i] = a[i] + b[i]`. What question tells you whether the CUDA version has enough useful parallel work?',
            answer: 'Ask how many independent elements exist and whether the launch creates enough GPU threads to cover them without excessive overhead.'
          },
          {
            id: 'cuda.kernel.debug_tiny_input',
            kind: 'debugging',
            prompt: 'A CUDA vector add is slower than a CPU version for n=64. What is one plausible explanation that is not “the GPU is bad”?',
            answer: 'The launch and transfer overheads can dominate when the input is too small to expose useful parallelism.'
          }
        ]
      },
      {
        type: 'artifact',
        title: 'Artifact 1: vector add is small enough to inspect',
        caption:
          'Vector add is not interesting as an algorithm. It is useful because every thread-to-element mapping mistake is visible.',
        prediction: {
          id: 'artifact.vector_add.launch_prediction',
          prompt:
            'For n=1000 and blockDim.x=256, how many blocks are launched, and which threads in the final block should do no array access?',
          placeholder: 'Write the block count and the range of out-of-bounds global indices before revealing the launch sketch.'
        },
        tabs: [
          {
            kind: 'source',
            label: 'Kernel sketch',
            language: 'cpp',
            body: `__global__ void add(float* out, const float* a, const float* b, int n) {
  int i = blockIdx.x * blockDim.x + threadIdx.x;
  if (i < n) {
    out[i] = a[i] + b[i];
  }
}`
          },
          {
            kind: 'evidence',
            label: 'Launch sketch',
            language: 'cpp',
            body: `int threads = 256;
int blocks = (n + threads - 1) / threads;
add<<<blocks, threads>>>(out, a, b, n);`
          },
          {
            kind: 'interpretation',
            label: 'What to inspect',
            language: 'text',
            body: 'ceil(1000/256)=4 blocks, so 1024 threads exist. Threads with global indices 1000..1023 exist only because the launch was rounded up; the bounds guard prevents them from touching arrays.'
          }
        ]
      },
      {
        type: 'paragraph',
        text:
          'Before learning more CUDA vocabulary, inspect the first possible crime scene: which element does one thread think it owns? The one-dimensional global index looks trivial, but it appears inside almost every beginner bug: repeated writes, skipped elements, and out-of-bounds accesses.'
      },
      {
        type: 'reviewSet',
        title: 'Thread, block, grid, index',
        intro: 'These cards should become automatic before memory and synchronization enter the story.',
        feedback:
          'If this was missed, draw a row of blocks first, then draw thread indices inside one block. The global index is block offset plus local thread offset.',
        cards: [
          {
            id: 'cuda.thread.block.grid.roles',
            prompt: 'In CUDA, what is the rough relationship between a grid, blocks, and threads?',
            answer: 'A kernel launch creates a grid; the grid contains blocks; each block contains threads.'
          },
          {
            id: 'cuda.index.global_1d',
            prompt: 'In a one-dimensional CUDA kernel, what is the common global thread index formula?',
            answer: '`blockIdx.x * blockDim.x + threadIdx.x`.'
          },
          {
            id: 'cuda.blockdim.meaning',
            prompt: 'What does `blockDim.x` usually mean in a one-dimensional launch?',
            answer: 'The number of threads in each block along the x dimension.'
          },
          {
            id: 'cuda.ceil_div.launch',
            prompt: 'Why does vector add often launch `ceil(n / blockDim.x)` blocks?',
            answer: 'So there are enough threads to cover all n elements, even when n is not divisible by the block size.'
          },
          {
            id: 'cuda.index.transfer_strided_copy',
            kind: 'transfer',
            prompt: 'In `j = (blockIdx.x * blockDim.x + threadIdx.x) * stride`, which part chooses the thread number and which part changes the memory address pattern?',
            answer: '`blockIdx.x * blockDim.x + threadIdx.x` chooses the global thread number; multiplying by stride changes the address pattern.'
          },
          {
            id: 'cuda.index.debug_repeated_writes',
            kind: 'debugging',
            prompt: 'A vector kernel gives repeated output values and leaves some elements unwritten. Which beginner indexing bug should you suspect first?',
            answer: 'A wrong global index formula, such as forgetting the block offset and using only `threadIdx.x`.'
          },
          {
            id: 'cuda.index.integrating_launch_map',
            kind: 'integrating',
            prompt: 'For blockDim.x=128, which block and thread produce global index 300?',
            answer: 'blockIdx.x=2 and threadIdx.x=44, because 2*128+44=300.'
          }
        ]
      },
      {
        type: 'paragraph',
        text:
          'Rounding up the launch creates extra threads. Extra threads are not the problem; letting them read or write outside the array is the problem. That is why the bounds guard belongs in the mental model, not just in a copied template.'
      },
      {
        type: 'reviewSet',
        title: 'Bounds guards',
        intro: 'The guard is a correctness invariant, not boilerplate.',
        feedback:
          'If this was forgotten, focus on the final block. Most blocks may be full, but the last block often contains threads whose global index is outside the valid array range.',
        cards: [
          {
            id: 'cuda.bounds_guard.purpose',
            prompt: 'Why does vector add usually include `if (i < n)`?',
            answer: 'Because the launch may create more threads than elements, and extra threads must not access outside the arrays.'
          },
          {
            id: 'cuda.bounds_bug.silent',
            prompt: 'Why can a missing bounds guard sometimes appear to work?',
            answer: 'Out-of-bounds behavior may not crash immediately, especially for small overruns or lucky memory layout, but the program is still incorrect.'
          },
          {
            id: 'cuda.launch_extra_threads',
            prompt: 'Is launching a few extra threads inherently wrong?',
            answer: 'No. It is common. It becomes wrong only if those threads perform invalid memory accesses or writes.'
          },
          {
            id: 'cuda.bounds.transfer_filter_kernel',
            kind: 'transfer',
            prompt: 'A filter kernel writes only when `i < n && keep[i]`. Which part is the bounds guard and which part is algorithm logic?',
            answer: '`i < n` is the bounds guard; `keep[i]` is algorithm logic deciding whether this valid element should be written.'
          },
          {
            id: 'cuda.bounds.debug_last_block',
            kind: 'debugging',
            prompt: 'A kernel only fails when n is not divisible by the block size. Which check should you inspect first?',
            answer: 'Inspect whether the kernel has a correct bounds guard for threads in the final partially used block.'
          }
        ]
      },
      {
        type: 'paragraph',
        text:
          'Now change the question. Correctness asked, “which element does this thread own?” Performance often asks, “what are neighboring lanes doing together?” A warp is the group whose lanes tend to execute the same instruction together. When lanes take different branches or touch scattered memory, the hardware has less clean work to do.'
      },
      {
        type: 'reviewSet',
        title: 'Warp and SIMT intuition',
        intro: 'These cards are only a first model; details vary by architecture, but the intuition is portable.',
        feedback:
          'If this was confusing, shift from “one thread runs alone” to “neighboring lanes often advance through the same instruction stream together.”',
        cards: [
          {
            id: 'cuda.warp.common_size',
            prompt: 'What is the common CUDA warp size used for first-order reasoning?',
            answer: '32 threads.'
          },
          {
            id: 'cuda.simt.basic',
            prompt: 'What does SIMT suggest about threads in the same warp?',
            answer: 'They are programmed as separate threads, but the hardware often issues one instruction across multiple lanes together.'
          },
          {
            id: 'cuda.divergence.basic',
            prompt: 'What is warp divergence?',
            answer: 'Threads in the same warp follow different control-flow paths, so the paths may need to be executed with different active lanes.'
          },
          {
            id: 'cuda.divergence.not_all_branches',
            prompt: 'Does every `if` statement necessarily cause harmful divergence?',
            answer: 'No. It depends on whether lanes within the same warp take different paths and whether the branch is performance-relevant.'
          },
          {
            id: 'cuda.divergence.transfer_even_odd',
            kind: 'transfer',
            prompt: 'A branch tests `if (threadIdx.x % 2 == 0)`. Why is this more suspicious than `if (blockIdx.x % 2 == 0)`?',
            answer: 'The even/odd thread branch splits lanes inside the same warp, while the block-level branch is more likely to send whole blocks down one path.'
          },
          {
            id: 'cuda.warp.integrating_lane_view',
            kind: 'integrating',
            prompt: 'Why do warp divergence and coalescing both ask you to look across neighboring lanes instead of one thread?',
            answer: 'Both are warp-level phenomena: one concerns which control path neighboring lanes take, the other which addresses neighboring lanes touch.'
          }
        ]
      },
      {
        type: 'paragraph',
        text:
          'Now follow the data instead of the threads. CUDA exposes several memory spaces because a GPU is not a uniform box of storage. Large memory is usually far away; small memory close to execution is precious. Performance often turns on whether data travels once or many times.'
      },
      {
        type: 'reviewSet',
        title: 'Memory hierarchy first pass',
        intro: 'The aim is not to memorize every memory space. Remember only distinctions that soon explain code behavior.',
        feedback:
          'If this was missed, classify memory by visibility and distance: thread-private registers are close, block-shared memory is on-chip, global memory is large and farther away.',
        cards: [
          {
            id: 'cuda.global_memory.basic',
            prompt: 'What is global memory good at, and what is its main cost?',
            answer: 'It is large and visible across the device, but accesses are relatively slow compared with on-chip storage.'
          },
          {
            id: 'cuda.register_scope',
            prompt: 'Registers are private to what execution scope?',
            answer: 'They are private to a thread.'
          },
          {
            id: 'cuda.shared_scope',
            prompt: 'Shared memory is shared by which threads?',
            answer: 'Threads in the same block.'
          },
          {
            id: 'cuda.local_memory.warning',
            prompt: 'Why is the name “local memory” potentially misleading in CUDA?',
            answer: 'It is local to a thread in the programming model, but it may live in off-chip memory and be much slower than registers.'
          },
          {
            id: 'cuda.memory.transfer_variable_placement',
            kind: 'transfer',
            prompt: 'A temporary value is used only by one thread. Which storage class should you hope the compiler keeps it in?',
            answer: 'A register, if resource limits allow it.'
          },
          {
            id: 'cuda.memory.debug_spill',
            kind: 'debugging',
            prompt: 'A kernel becomes slower after adding many per-thread temporary variables. What memory-related issue might you investigate?',
            answer: 'Register pressure and possible spilling to local memory.'
          }
        ]
      },
      {
        type: 'artifact',
        title: 'Artifact 2: strided copy makes memory access visible',
        caption:
          'This artifact asks for a prediction before running. The exact GB/s is less important than the trend and the explanation.',
        prediction: {
          id: 'artifact.strided_copy.bandwidth_prediction',
          prompt:
            'Rank stride=1, stride=2, stride=8, and stride=32 by expected bandwidth. Explain your ranking in terms of the addresses touched by neighboring warp lanes.',
          placeholder: 'Write your ranking before revealing the reference interpretation.'
        },
        tabs: [
          {
            kind: 'source',
            label: 'Kernel sketch',
            language: 'cpp',
            body: `__global__ void copy_stride(float* out, const float* in, int n, int stride) {
  int i = blockIdx.x * blockDim.x + threadIdx.x;
  if (i < n) {
    out[i] = in[(i * stride) % n];
  }
}`
          },
          {
            kind: 'evidence',
            label: 'Reference pattern',
            language: 'text',
            body: 'This sketch keeps the same number of active threads and writes the same dense output range for every stride. Only the input address pattern changes: neighboring lanes read neighboring locations for stride=1 and increasingly separated locations for larger strides.'
          },
          {
            kind: 'interpretation',
            label: 'Reference interpretation',
            language: 'text',
            body: 'Stride 1 usually gives adjacent threads adjacent addresses. Large strides scatter a warp across memory, which tends to waste memory transaction bandwidth. Treat this as an address-pattern sketch: a production microbenchmark would also control modulo overhead, cache state, alignment, and problem size.'
          }
        ]
      },
      {
        type: 'paragraph',
        text:
          'Before naming the rule, write down the addresses. If neighboring lanes request 0, 1, 2, 3, the pattern tells one story. If they request 0, 32, 64, 96, it tells another. Coalescing is the name for the hardware-friendly version of this warp-level address story.'
      },
      {
        type: 'reviewSet',
        title: 'Coalescing basics',
        intro: 'These cards deliberately encode the same idea as words, address sequence, and debugging symptom.',
        feedback:
          'If this was forgotten, write the addresses for lanes 0, 1, 2, 3. Coalescing is easier to see as an address sequence than as a single-thread property.',
        cards: [
          {
            id: 'cuda.coalescing.address_sequence',
            prompt: 'For coalescing intuition, should you inspect one thread or the address sequence across neighboring warp lanes?',
            answer: 'Inspect the address sequence across neighboring lanes.'
          },
          {
            id: 'cuda.coalescing.adjacent',
            prompt: 'Why is `a[i]` often better than `a[i * 32]` when lane i reads one element?',
            answer: '`a[i]` gives neighboring lanes neighboring addresses, which is easier for hardware to combine into efficient memory transactions.'
          },
          {
            id: 'cuda.coalescing.symptom',
            prompt: 'A kernel has low memory throughput and scattered per-lane addresses. What is one likely issue?',
            answer: 'Poor coalescing or inefficient global memory access pattern.'
          },
          {
            id: 'cuda.coalescing.hardware_caveat',
            prompt: 'Why should a coalescing explanation avoid exact transaction rules in an introductory essay?',
            answer: 'Exact rules vary by architecture; the portable first model is that neighboring lanes should usually touch neighboring addresses.'
          },
          {
            id: 'cuda.coalescing.transfer_matrix_column',
            kind: 'transfer',
            prompt: 'In row-major storage, why can a warp reading a matrix column be less friendly than reading a row?',
            answer: 'Neighboring lanes reading a column usually access addresses separated by the row stride, not adjacent elements.'
          },
          {
            id: 'cuda.coalescing.integrating_warp_addresses',
            kind: 'integrating',
            prompt: 'Lanes 0..3 read addresses 1000, 1004, 1008, 1012 bytes. Is this address pattern more like coalesced or scattered access?',
            answer: 'More like coalesced access: neighboring lanes read neighboring 4-byte floats.'
          }
        ]
      },
      {
        type: 'paragraph',
        text:
          'The next experiment asks what happens when data is worth bringing closer. Shared memory is useful when a block of threads can cooperatively load data once and reuse it many times. But the word shared has a boundary: it means shared inside a block, not across the whole grid.'
      },
      {
        type: 'reviewSet',
        title: 'Shared memory scope',
        intro: 'These cards prepare the reader for tiled matmul without yet teaching tiled matmul.',
        feedback:
          'If this was missed, remember the boundary: shared memory is a scratchpad for cooperation inside one block, not a communication space for the whole grid.',
        cards: [
          {
            id: 'cuda.shared.block_scope',
            prompt: 'Shared memory is visible to all threads in the grid or only within one block?',
            answer: 'Only within one block.'
          },
          {
            id: 'cuda.shared.lifetime',
            prompt: 'Shared memory lifetime is usually tied to what?',
            answer: 'The execution of a block.'
          },
          {
            id: 'cuda.shared.reuse_goal',
            prompt: 'What is the basic reason to stage data in shared memory?',
            answer: 'To let threads in a block reuse data from faster on-chip storage instead of repeatedly loading from global memory.'
          },
          {
            id: 'cuda.shared.not_free',
            prompt: 'Why is shared memory not automatically a performance win?',
            answer: 'It consumes limited on-chip resources, requires synchronization, and only helps when the data is reused or access is improved enough.'
          },
          {
            id: 'cuda.shared.transfer_histogram',
            kind: 'transfer',
            prompt: 'A block builds a small histogram that all its threads update before writing one result. Why might shared memory be useful?',
            answer: 'Threads in the block can cooperate through a fast block-local scratchpad before writing fewer results to global memory.'
          },
          {
            id: 'cuda.shared.integrating_tiled_matmul_preview',
            kind: 'integrating',
            prompt: 'Why will tiled matmul naturally use shared memory in the next essay?',
            answer: 'A block can load A and B tiles once into shared memory, then reuse them for many multiply-adds inside the block.'
          }
        ]
      },
      {
        type: 'paragraph',
        text:
          'Once threads cooperate through shared memory, ordering matters. A thread may read a shared array element before another thread has written it unless the program establishes a block-level barrier.'
      },
      {
        type: 'reviewSet',
        title: 'Synchronization and races',
        intro: 'The goal is to distinguish scope, ordering, and atomicity before reductions become complicated.',
        feedback:
          'If this was missed, you may be mixing three ideas: scope tells who participates, ordering tells when reads are safe, and atomicity protects a shared update.',
        cards: [
          {
            id: 'cuda.syncthreads.scope',
            prompt: '`__syncthreads()` synchronizes all threads in the grid. True or false?',
            answer: 'False. It synchronizes threads within the same block.',
            feedback:
              'This is the common confusion: `__syncthreads()` is a block-level barrier, not a grid-level barrier. Cross-block coordination needs a different design.'
          },
          {
            id: 'cuda.syncthreads.shared_load',
            prompt: 'Why might code need `__syncthreads()` after loading a shared-memory tile?',
            answer: 'To ensure the block has finished writing the tile before any thread reads from it.'
          },
          {
            id: 'cuda.race.basic',
            prompt: 'What is a race condition in a CUDA kernel?',
            answer: 'A bug where correctness depends on an uncontrolled ordering of reads and writes by multiple threads.'
          },
          {
            id: 'cuda.atomic.basic',
            prompt: 'What does an atomic operation protect at a high level?',
            answer: 'It makes a read-modify-write update to a shared location occur as one indivisible operation with respect to other atomic updates.'
          },
          {
            id: 'cuda.sync.transfer_shared_read',
            kind: 'transfer',
            prompt: 'A thread reads `tile[threadIdx.x + 1]`, which may have been written by a neighboring thread. What should you check?',
            answer: 'Check whether all threads that write the shared tile have reached a barrier before any thread reads neighboring entries.'
          },
          {
            id: 'cuda.reduction.debug_missing_barrier',
            kind: 'debugging',
            prompt: 'A block reduction sometimes changes its answer between runs. What synchronization bug is especially plausible?',
            answer: 'Missing or misplaced block-level barriers after the load or between shared-memory producer-consumer phases.'
          },
          {
            id: 'cuda.sync.integrating_scope_order_atomic',
            kind: 'integrating',
            prompt: 'How do `__syncthreads()` and atomic add solve different problems?',
            answer: '`__syncthreads()` orders threads in one block; atomic add protects concurrent updates to one memory location.'
          }
        ]
      },
      {
        type: 'artifact',
        title: 'Artifact 3: broken reduction is a correctness microscope',
        caption:
          'A reduction is useful here because it fails when cooperation rules are vague. The point is not to optimize reduction yet; the point is to learn what can go wrong.',
        prediction: {
          id: 'artifact.broken_reduction.race_prediction',
          prompt:
            'Before revealing the fix direction, identify where barriers are missing after the load and between producer-consumer phases.',
          placeholder: 'Write the producer-consumer phases you see in shared memory.'
        },
        tabs: [
          {
            kind: 'source',
            label: 'Broken sketch',
            language: 'cpp',
            body: `__shared__ float partial[256];
int tid = threadIdx.x;
partial[tid] = input[blockIdx.x * blockDim.x + tid];
// Missing barriers after the load and between producer-consumer phases.
for (int offset = blockDim.x / 2; offset > 0; offset /= 2) {
  if (tid < offset) partial[tid] += partial[tid + offset];
}
if (tid == 0) output[blockIdx.x] = partial[0];`
          },
          {
            kind: 'evidence',
            label: 'Question',
            language: 'text',
            body: 'Where must ordering be established after the initial load? Which loop iterations produce values read by later iterations? Why might the bug appear nondeterministic?'
          },
          {
            kind: 'interpretation',
            label: 'Fix direction',
            language: 'text',
            body: 'A correct block reduction needs barriers after the initial load and between reduction phases where one step produces values read by the next. Not just one `__syncthreads()` at the top: until you intentionally switch to a warp-synchronous or otherwise optimized design, each block-level producer-consumer phase needs ordering.'
          }
        ]
      },
      {
        type: 'paragraph',
        text:
          'The last move is to demand a receipt. If a CUDA essay teaches one measurement habit, it should be this: never interpret a timing number without knowing what was timed, what data size was used, and which GPU produced it.'
      },
      {
        type: 'reviewSet',
        title: 'Measurement discipline',
        intro: 'These cards protect the reader from false performance rules.',
        feedback:
          'If this was missed, slow down before optimizing. A timing number is only useful when you know what was measured, on what hardware, and under what synchronization.',
        cards: [
          {
            id: 'cuda.measurement.warmup',
            prompt: 'Why do CUDA benchmarks usually need warmup iterations?',
            answer: 'To avoid measuring one-time effects such as initialization, compilation, cache state, or clock ramp behavior.'
          },
          {
            id: 'cuda.measurement.sync',
            prompt: 'Why can host-side timing be wrong if you do not synchronize appropriately?',
            answer: 'Kernel launches are often asynchronous, so the CPU timer may measure launch submission rather than completed GPU work.'
          },
          {
            id: 'cuda.occupancy.not_goal',
            prompt: 'Is higher occupancy always better?',
            answer: 'No. Occupancy can help hide latency, but performance may be limited by bandwidth, instruction throughput, register pressure, or other factors.'
          },
          {
            id: 'cuda.profiler.hypothesis',
            prompt: 'What should a profiler observation produce before code changes?',
            answer: 'A specific hypothesis that a small experiment can test.'
          },
          {
            id: 'cuda.measurement.transfer_compare_gpus',
            kind: 'transfer',
            prompt: 'Kernel A is faster than kernel B on an H100 but slower on an older GPU. What should this make you suspect?',
            answer: 'The optimization may depend on architecture-specific memory hierarchy, cache, scheduling, or specialized hardware behavior.'
          },
          {
            id: 'cuda.profiler.debug_low_throughput',
            kind: 'debugging',
            prompt: 'A memory-bound kernel shows low throughput. Name two hypotheses to test before rewriting the algorithm.',
            answer: 'Poor coalescing and insufficient parallelism are two plausible hypotheses; cache behavior, occupancy, or measurement error may also matter.'
          },
          {
            id: 'cuda.measurement.integrating_claim',
            kind: 'integrating',
            prompt: 'What information should accompany the claim “this CUDA kernel is 3x faster”?',
            answer: 'GPU model, input size, baseline, timing method, synchronization method, repetitions/warmup, and ideally profiler evidence.'
          }
        ]
      },
      {
        type: 'paragraph',
        text:
          'This essay stops before matrix multiplication on purpose. The next essay can now use these ideas without introducing them all at once: a block owns a C tile, threads cooperatively load A and B tiles, barriers make the shared-memory reuse correct, and benchmark evidence tells us whether the optimization paid off.'
      }
    ]
  }
];

const cudaNarrativeInsertions = [
  {
    afterTitle: 'Kernel execution basics',
    paragraphs: [
      'The first trap in CUDA is that the program has two authors of motion. The host program says how much work to create; the device program says what one piece of that work does. A beginner often reads the kernel body as if it were an ordinary function called once. That reading is almost always wrong. The same few lines are being instantiated across a grid of threads, and most later mistakes come from forgetting that multiplication of contexts.',
      'Think of a kernel launch less like calling a function and more like printing a stencil over a sheet of data. The stencil pattern is the block shape. The repeated placements of the stencil are the grid. Inside each placement, `threadIdx.x` names a point in the stencil, while `blockIdx.x` names which placement you are looking at. This is why the global index formula is not trivia. It is the coordinate transform between the stencil world and the array world.',
      'There is also an emotional reason to start this small. GPU programming can feel disorienting because a program can be both obviously parallel and mysteriously slow. Vector add removes the algorithmic mystery. If a vector add is wrong, the explanation is almost certainly indexing, bounds, launch configuration, memory movement, or timing. Those are exactly the bones we need before larger kernels have muscles and skin.'
    ]
  },
  {
    afterTitle: 'Artifact 1: vector add is small enough to inspect',
    paragraphs: [
      'In the vector add artifact, there are two separate acts of arithmetic. The launch arithmetic chooses how many blocks exist. The kernel arithmetic chooses which element one thread owns. They rhyme, but they are not the same. If the launch produces too few threads, some elements never get an owner. If the kernel maps owners incorrectly, multiple threads may claim the same element or wander outside the array.',
      'The final block is the best place to debug your mental model. Most blocks are boring: every thread has a valid element. The last block is where the abstraction leaks. Some threads are real GPU threads, but they correspond to no real array element. The bounds guard is the small piece of code that says: existence as a thread does not imply permission to touch memory.',
      'This is a recurring CUDA pattern. We create a simple rectangular world because hardware likes regular groups of work, then use guards to fit irregular problem sizes. Later, matrix multiplication will do the same thing at two dimensions. Edge tiles exist because the launch grid is rectangular; guards make those edge tiles safe.'
    ]
  },
  {
    afterTitle: 'Thread, block, grid, index',
    paragraphs: [
      'Once indexing is clear, the next question is what the hardware can do with all these threads. CUDA exposes threads because they are the unit the programmer reasons about, but the machine often schedules them in groups. That gap between the programming unit and the scheduling intuition is not a nuisance. It is where many performance explanations live.',
      'A single thread is too small a lens for performance. If one lane reads a float, you know almost nothing. If thirty-two neighboring lanes read thirty-two neighboring floats, you know something important: the memory system has a clean pattern to work with. Likewise, if neighboring lanes branch in different directions, you have learned something about the instruction stream. CUDA performance is frequently a story about neighborhoods, not individuals.',
      'This is also why the same code can feel simple and subtle at the same time. The line `out[i] = a[i] + b[i]` is simple. The question of whether the lanes executing that line have good addresses, enough occupancy, and no hidden synchronization bottleneck is not simple. The essay will keep returning to this two-level view: one thread explains correctness; a neighborhood of threads explains much of performance.'
    ]
  },
  {
    afterTitle: 'Bounds guards',
    paragraphs: [
      'Bounds guards have a reputation as boilerplate, but boilerplate is exactly what should become fluent. If you have to stop and re-derive why `i < n` is there every time, you are spending attention on the wrong layer. The guard should become a small invariant you can trust while thinking about deeper behavior.',
      'The hidden danger is that missing guards may fail politely. A CPU program with an out-of-bounds bug may crash in a way that feels direct. A GPU kernel can instead corrupt a neighboring buffer, produce a plausible number, or fail only at certain input sizes. This is why the final partial block is not a corner case to handle later; it is the test of whether you understand the launch geometry at all.',
      'Notice the distinction between a guard and an algorithmic condition. `i < n` says whether a thread corresponds to a valid element. `keep[i]` or `a[i] > 0` says whether the valid element should participate in the algorithm. Mixing those two ideas is a common way to write kernels that are locally readable but globally fragile.'
    ]
  },
  {
    afterTitle: 'Warp and SIMT intuition',
    paragraphs: [
      'The warp is where the essay starts to become less like ordinary programming. In ordinary scalar code, a branch is a private choice made by one control flow. In CUDA, a branch can become a group event. If different lanes in a warp want different paths, the hardware still has to issue instructions in a way that respects those choices. The result is not usually a correctness bug, but it can be a performance tax.',
      'Do not turn this into superstition. Branches are not poison. A branch that splits whole blocks may be cheap enough. A branch that is rarely executed may not matter. A branch whose cost is hidden behind memory latency may not dominate. The useful habit is narrower: when performance looks odd, ask whether neighboring lanes are still doing the same kind of work at the same time.',
      'This idea prepares us for coalescing. Divergence asks whether neighboring lanes take neighboring instruction paths. Coalescing asks whether neighboring lanes touch neighboring addresses. The two topics feel different in code, but they share a visual habit: stop staring at one lane and draw the warp.'
    ]
  },
  {
    afterTitle: 'Memory hierarchy first pass',
    paragraphs: [
      'Memory hierarchy is where many CUDA tutorials become a list of storage names. That list is not the point. The point is distance, visibility, and reuse. Registers are close and private. Shared memory is close and block-local. Global memory is large and visible, but comparatively far away. You should read every storage choice as a claim about who needs the data and how often it will be reused.',
      'A useful mental image is a workshop. Registers are the tools in one worker’s hands. Shared memory is the workbench shared by one small team. Global memory is the warehouse. Walking to the warehouse for every screw is legal, but if the team will use the same screws many times, bringing a box to the bench changes the work. That is the story behind many tiled kernels.',
      'The local memory name is an especially good warning that vocabulary can mislead. Local sounds close, but in CUDA it means local to a thread in the programming model, not necessarily stored in fast nearby hardware. If too many per-thread values exceed register capacity, spills can make a kernel slower in ways that surprise people who only read variable scopes.'
    ]
  },
  {
    afterTitle: 'Artifact 2: strided copy makes memory access visible',
    paragraphs: [
      'The strided copy artifact is deliberately artificial. It is not meant to be a production benchmark; it is a microscope slide. We keep the number of active threads and the output range fixed so that one variable is easier to see: the input address pattern generated by neighboring lanes. This is the kind of simplification that makes an educational artifact honest rather than toy-like.',
      'The modulo in the sketch is also a reminder to be careful. A serious microbenchmark would avoid letting modulo overhead become the story, control alignment, warm up caches, choose sizes that defeat accidental caching, and report hardware details. But for the essay, the important visual fact is simple: stride changes the distance between addresses requested by neighboring lanes.',
      'If you remember only one sentence about coalescing at this stage, make it this one: the memory system sees a warp-shaped bundle of addresses, not your source code comments. Your job is to make that bundle easy to serve whenever the algorithm allows it.'
    ]
  },
  {
    afterTitle: 'Coalescing basics',
    paragraphs: [
      'Coalescing is satisfying because it turns invisible hardware behavior into something you can often sketch with pencil marks. Write lane numbers across a row. Under each lane, write the address it requests. If the addresses march forward compactly, the pattern is friendly. If they leap across memory, the pattern is suspicious. This is not the full architectural rulebook, but it is a good first instrument.',
      'The matrix case makes the idea concrete. In row-major storage, moving across a row touches adjacent memory; moving down a column jumps by the row stride. A warp that maps lanes across a row tends to have an easier time than a warp that maps lanes down a column. This is why layout and thread mapping become inseparable once performance matters.',
      'Microbenchmark papers and roofline analyses exist because real machines add detail to this simple picture. Cache levels, memory partitions, instruction mix, predication, and shared-memory behavior can all matter. The beginner mistake is not having a simplified model. The mistake is forgetting that the simplified model is a starting point, not a law of nature.'
    ]
  },
  {
    afterTitle: 'Shared memory scope',
    paragraphs: [
      'Shared memory is the first CUDA feature that feels like a small social contract. Threads in a block agree to use a common scratchpad. Some threads put data there; other threads read it; together they avoid repeated trips to global memory. But a social contract needs rules. Who participates? Only the block. How long does the scratchpad live? For the block’s execution. When is it safe to read? Only after the relevant writes are complete.',
      'This is why shared memory appears together with synchronization in so many kernels. The memory space gives threads a place to cooperate; the barrier gives them a moment at which cooperation becomes well-defined. Without the barrier, the code may look like a team but behave like a crowd entering a room through different doors at different times.',
      'The next essay on matrix multiplication will make this tangible. A block will load a tile of A and a tile of B, then reuse those tiles for many multiply-adds. The performance payoff comes from reuse. The correctness condition comes from synchronization. The resource tradeoff comes from the limited size of the shared scratchpad and registers.'
    ]
  },
  {
    afterTitle: 'Synchronization and races',
    paragraphs: [
      'Synchronization bugs are unpleasant because they often look like ghosts. The code is deterministic as text, but the schedule is not a single tidy sequence. If one thread reads before another thread writes, the program may sometimes see yesterday’s value, sometimes today’s value, and sometimes a value that merely looks plausible.',
      'The most important distinction is scope. `__syncthreads()` is a meeting for one block. It is not a meeting for the whole grid. If you need every block to finish phase one before any block begins phase two, you usually need a different kernel launch, a cooperative-groups design, or another explicit mechanism. Treating a block barrier as a grid barrier is one of those mistakes that can survive small tests and fail under scale.',
      'Atomic operations solve a different problem. A barrier says: everyone in this scope has arrived here. An atomic update says: this particular shared update should not be interleaved with another update to the same location. You can need one, the other, both, or neither. Keeping those concepts separate prevents a lot of cargo-cult synchronization.'
    ]
  },
  {
    afterTitle: 'Artifact 3: broken reduction is a correctness microscope',
    paragraphs: [
      'The broken reduction is intentionally unfair to the reader in the same way real bugs are unfair: the code looks close to correct. Each thread writes a value. Then pairs are added. Then one result is written. The missing piece is temporal, not syntactic. Some reads depend on writes by other threads, and the code has not established the moment when those writes are complete.',
      'Reduction is the first place many CUDA learners meet the difference between mathematical associativity and program ordering. The mathematical sum does not care which pair is added first. The program absolutely cares whether the data being added has been produced. Parallelism gives you many legal orders only after you define the boundaries between phases.',
      'This is why the essay delays optimized reduction techniques. Warp-level primitives, bank conflicts, occupancy, and atomics can all be important, but they are not the first lesson. The first lesson is seeing producer-consumer structure in shared memory. Once you can see that, the optimized versions become refinements instead of magic.'
    ]
  },
  {
    afterTitle: 'Measurement discipline',
    paragraphs: [
      'Performance measurement is the essay’s final concept because it keeps the earlier concepts honest. A story about coalescing is only a hypothesis until the measurement setup lets you see memory behavior. A story about occupancy is only a hypothesis until you know whether the kernel is latency-bound, bandwidth-bound, or compute-bound. CUDA optimization is not a bag of tricks; it is a loop of model, prediction, evidence, and revision.',
      'This is where the local resources in the CUDA folder become relevant. Roofline papers, instruction-roofline models, and architecture microbenchmarks all say the same practical thing in different languages: modern GPUs are too complex for context-free performance slogans. A V100 story, an A100 story, a Hopper story, and a Blackwell story may rhyme, but they are not identical stories.',
      'The point is not to frighten you away from simple models. The point is to earn better models gradually. At the end of this first essay, you should be able to inspect a small kernel and ask useful questions: Who owns each element? Which lanes branch together? Which lanes touch neighboring addresses? Which memory space holds the reused data? What synchronization makes the cooperation legal? What measurement would prove or disprove my explanation?'
    ]
  }
];

const cudaInlineFigureInsertions = [
  {
    afterTitle: 'Artifact 1: vector add is small enough to inspect',
    figure: {
      type: 'inlineFigure',
      id: 'last-block-boundary',
      title: '1000 elements, 1024 launched threads',
      caption:
        'The final 24 threads exist as GPU threads, but the bounds guard prevents them from touching memory.',
      rows: [
        ['valid element indices', '0 ... 999'],
        ['launched thread indices', '0 ... 1023'],
        ['threads with no legal element', '1000 ... 1023']
      ]
    }
  },
  {
    afterTitle: 'Artifact 2: strided copy makes memory access visible',
    figure: {
      type: 'inlineFigure',
      id: 'warp-address-tape',
      title: 'A warp-shaped address tape',
      caption:
        'Coalescing becomes easier to reason about when addresses are written under neighboring lanes.',
      rows: [
        ['lane', '0 1 2 3 4 5 6 7'],
        ['stride=1 reads', '0 1 2 3 4 5 6 7'],
        ['stride=2 reads', '0 2 4 6 8 10 12 14'],
        ['stride=8 reads', '0 8 16 24 32 40 48 56'],
        ['stride=32 reads', '0 32 64 96 128 160 192 224']
      ]
    }
  },
  {
    afterTitle: 'Synchronization and races',
    figure: {
      type: 'inlineFigure',
      id: 'barrier-timeline',
      title: 'The barrier is a time boundary',
      caption:
        'A shared-memory read is safe only after the block has finished the writes that read depends on.',
      rows: [
        ['phase 1', 'threads write shared memory'],
        ['barrier', '__syncthreads()'],
        ['phase 2', 'threads read neighbor values']
      ]
    }
  }
];

enrichPrimaryEssayNarrative();
addCudaInlineFigures();

function enrichPrimaryEssayNarrative() {
  const essay = essays.find((item) => item.slug === primaryEssaySlug);
  if (!essay || essay._narrativeExpanded) return;

  for (const insertion of cudaNarrativeInsertions) {
    const index = essay.sections.findIndex((section) => section.title === insertion.afterTitle);
    if (index === -1) continue;
    essay.sections.splice(
      index + 1,
      0,
      ...insertion.paragraphs.map((text) => ({
        type: 'paragraph',
        text
      }))
    );
  }

  essay._narrativeExpanded = true;
}

function addCudaInlineFigures() {
  const essay = essays.find((item) => item.slug === primaryEssaySlug);
  if (!essay || essay._inlineFiguresAdded) return;

  for (const insertion of cudaInlineFigureInsertions) {
    const index = essay.sections.findIndex((section) => section.title === insertion.afterTitle);
    if (index === -1) continue;
    essay.sections.splice(index + 1, 0, insertion.figure);
  }

  essay._inlineFiguresAdded = true;
}

export function getEssay(slug) {
  return essays.find((essay) => essay.slug === slug) ?? essays.find((essay) => essay.slug === primaryEssaySlug);
}

export function normalizeCards(section) {
  if (section.type !== 'reviewSet') return [];
  return section.cards.map((card) => ({
    kind: card.kind ?? inferCardKind(card),
    feedback: card.feedback ?? section.feedback,
    ...card
  }));
}

function inferCardKind(card) {
  if (card.id.includes('.debug') || card.id.includes('.symptom')) return 'debugging';
  if (card.id.includes('.transfer')) return 'transfer';
  if (card.id.includes('.integrating')) return 'integrating';
  if (card.id.includes('.prediction') || card.id.includes('.hypothesis')) return 'prediction';
  if (card.prompt.startsWith('Why')) return 'discrimination';
  return 'atomic';
}

export function getAllCards() {
  return essays.flatMap((essay) =>
    essay.sections.flatMap((section) => {
      if (section.type !== 'reviewSet') return [];
      return normalizeCards(section).map((card) => ({
        ...card,
        essaySlug: essay.slug,
        essayTitle: essay.title,
        groupTitle: section.title
      }));
    })
  );
}
