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
    status: 'published essay'
  },
  {
    slug: 'compiler',
    title: 'The Tensor Mill',
    subtitle: 'A tour through tensor IR, lowering, and schedules',
    status: 'published essay'
  },
  {
    slug: 'tilelang',
    title: 'The TileLang Forge',
    subtitle: 'A TileLang essay about tiles, schedules, and generated code',
    status: 'published essay'
  }
];

export const reviewIntervals = ['in-text', '5 days', '2 weeks', '1 month', '2 months', 'long-term'];

export const tilelangLabs = [
  {
    id: 'tilelang-lab-01',
    title: 'Lab 1: First kernel and generated source',
    purpose:
      'Turn the first TileLang kernel into a concrete ownership exercise: predict the slice, run or inspect the kernel, and recover the same ownership in the generated source.',
    prediction:
      'Before looking at evidence, write which element range one program instance owns and how the final partial tile stays legal.',
    gpuPath:
      'Run the minimal add kernel, dump the generated CUDA/TIR, and annotate the launch axis, inner parallel loop, edge guard, and output store.',
    fallback:
      'Without a GPU, use the provided source sketch and lowered-code excerpt as a static receipt; still annotate ownership and the edge guard before reading the reference explanation.',
    receipt:
      'A correct lab note names the owned slice, identifies the guard, and explains which part of generated code corresponds to the TileLang source assignment.'
  },
  {
    id: 'tilelang-lab-02',
    title: 'Lab 2: GEMM tile anatomy',
    purpose:
      'Make `block_M`, `block_N`, and `block_K` visible as C ownership, A/B shared tiles, and repeated K phases.',
    prediction:
      'Before running or revealing the reference, predict the shapes of A_s, B_s, and C_f for one config and the number of K phases.',
    gpuPath:
      'Run one GEMM config, check correctness against a framework reference, dump the generated source, and mark global-to-shared copies, fragment accumulation, and final store.',
    fallback:
      'Without a GPU, inspect the reference receipt excerpt and fill the same tile table: C owner, A slice, B slice, K phase count, and output store.',
    receipt:
      'A correct lab note separates tile ownership from storage scope: C tile ownership stays fixed while the K slice advances.'
  },
  {
    id: 'tilelang-lab-03',
    title: 'Lab 3: Schedule receipt inspection',
    purpose:
      'Practice the three-receipt discipline: generated code for schedule fidelity, reference output for correctness, and benchmark or profiler data for performance.',
    prediction:
      'Before reading the winner, predict whether changing `num_stages` or `block_K` should help, hurt, or depend on hardware and shape.',
    gpuPath:
      'Run a small config sweep, keep the best-config cache, inspect the lowered source for copy/compute/store structure, and record timing with device, shape, dtype, warmup, and repetitions.',
    fallback:
      'Without a GPU, compare two reference receipts and decide which claim each one can support: lowering fidelity, correctness, or performance.',
    receipt:
      'A correct lab note refuses to let a fast benchmark prove lowering fidelity or a faithful lowering prove speed.'
  }
];

export const essays = [
  {
    slug: 'cuda',
    title: 'The Thread Atlas',
    subtitle: 'A CUDA field guide to threads, memory, and synchronization',
    author: 'Mnemonic Medium Lab',
    deckDescription:
      'A discovery-style CUDA essay and mnemonic atlas of invisible machines. The goal is to build durable intuition through small predictions, visible failure modes, and machine views that make hidden structure legible.',
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
        label: 'code lens + prediction',
        title: 'Artifact 1: vector add is small enough to inspect',
        caption:
          'Vector add is not interesting as an algorithm. It is useful because every thread-to-element mapping mistake is visible.',
        unitPattern: ['phenomenon', 'code', 'prediction', 'machine view', 'evidence', 'memory trace'],
        prediction: {
          id: 'artifact.vector_add.launch_prediction',
          prompt:
            'For n=1000 and blockDim.x=256, how many blocks are launched, and which threads in the final block should do no array access?',
          placeholder: 'Write the block count and the range of out-of-bounds global indices before revealing the launch sketch.'
        },
        tabs: [
          {
            kind: 'source',
            label: 'Source view',
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
            label: 'Evidence view',
            language: 'cpp',
            body: `int threads = 256;
int blocks = (n + threads - 1) / threads;
add<<<blocks, threads>>>(out, a, b, n);`
          },
          {
            kind: 'interpretation',
            label: 'Machine reading',
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
        title: 'Memory trace: ownership and launch geometry',
        label: 'memory trace',
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
        label: 'code lens + prediction',
        title: 'Artifact 2: strided copy makes memory access visible',
        caption:
          'This artifact asks for a prediction before running. The exact GB/s is less important than the trend and the explanation.',
        unitPattern: ['phenomenon', 'code', 'prediction', 'machine view', 'evidence', 'memory trace'],
        prediction: {
          id: 'artifact.strided_copy.bandwidth_prediction',
          prompt:
            'Rank stride=1, stride=2, stride=8, and stride=32 by expected bandwidth. Explain your ranking in terms of the addresses touched by neighboring warp lanes.',
          placeholder: 'Write your ranking before revealing the reference interpretation.'
        },
        tabs: [
          {
            kind: 'source',
            label: 'Source view',
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
            label: 'Evidence view',
            language: 'text',
            body: 'This sketch keeps the same number of active threads and writes the same dense output range for every stride. Only the input address pattern changes: neighboring lanes read neighboring locations for stride=1 and increasingly separated locations for larger strides.'
          },
          {
            kind: 'interpretation',
            label: 'Machine reading',
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
        title: 'Memory trace: warp address patterns',
        label: 'memory trace',
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
        type: 'artifact',
        label: 'code lens + prediction',
        title: 'Artifact 3: broken reduction is a correctness microscope',
        caption:
          'A reduction is useful here because it fails when cooperation rules are vague. The point is not to optimize reduction yet; the point is to learn what can go wrong.',
        unitPattern: ['phenomenon', 'code', 'prediction', 'machine view', 'evidence', 'memory trace'],
        prediction: {
          id: 'artifact.broken_reduction.race_prediction',
          prompt:
            'Before revealing the fix direction, identify where barriers are missing after the load and between producer-consumer phases.',
          placeholder: 'Write the producer-consumer phases you see in shared memory.'
        },
        tabs: [
          {
            kind: 'source',
            label: 'Source view',
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
            label: 'Evidence view',
            language: 'text',
            body: 'Where must ordering be established after the initial load? Which loop iterations produce values read by later iterations? Why might the bug appear nondeterministic?'
          },
          {
            kind: 'interpretation',
            label: 'Machine reading',
            language: 'text',
            body: 'A correct block reduction needs barriers after the initial load and between reduction phases where one step produces values read by the next. Not just one `__syncthreads()` at the top: until you intentionally switch to a warp-synchronous or otherwise optimized design, each block-level producer-consumer phase needs ordering.'
          }
        ]
      },
      {
        type: 'reviewSet',
        title: 'Memory trace: barriers and producer-consumer phases',
        label: 'memory trace',
        intro: 'The goal is to distinguish scope, ordering, and atomicity after the race is visible.',
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
  },
  {
    slug: 'matmul',
    title: 'The Tile Loom',
    subtitle: 'A CUDA essay about reuse, shared memory, and matrix multiplication',
    author: 'Mnemonic Medium Lab',
    deckDescription:
      'A discovery-style matmul essay about reuse, shared memory, and tile-shaped thinking. The goal is to make fast kernels feel less like folklore and more like visible data movement.',
    sections: [
      {
        type: 'paragraph',
        kicker: 'Opening question',
        text:
          'Naive matmul can reread the same values so many times that the arithmetic is no longer the whole story. One thread computes one output element, which sounds tidy. But across a block, neighboring threads may keep asking global memory for overlapping pieces of the same row of A and the same column of B.'
      },
      {
        type: 'paragraph',
        text:
          'That is why tiled matmul feels dramatic the first time it clicks. The flop count of matrix multiplication did not change. What changed is the path the data takes through the machine. Once a block cooperatively brings one tile closer, many multiply-adds can happen before those values need to travel again.'
      },
      {
        type: 'paragraph',
        text:
          'This essay stays on one line of explanation. We will start from the repeated traffic inside naive matmul, then ask what one block should own, what it should stage, when barriers are required, and why tile size is a resource negotiation rather than a magic constant.'
      },
      {
        type: 'paragraph',
        text:
          'Keep four questions nearby as you read. Which output tile does this block own? Which A and B values are being reread? Which of those values are worth staging in shared memory? At what moment is it safe for the next tile phase to overwrite the old one?'
      },
      {
        type: 'paragraph',
        kicker: 'Mystery',
        text:
          'If naive matmul already computes the right arithmetic, where does the big speed gap come from? The first answer is not tensor cores or instruction count. It is that many threads keep taking long trips for values that their neighbors also need.'
      },
      {
        type: 'artifact',
        label: 'code lens + prediction',
        title: 'Artifact 1: naive matmul rereads the same inputs',
        caption:
          'The code is mathematically fine. The interesting question is how much traffic it causes when many threads in one block work on neighboring outputs.',
        unitPattern: ['phenomenon', 'code', 'prediction', 'machine view', 'evidence', 'memory trace'],
        prediction: {
          id: 'artifact.matmul_naive.reuse_prediction',
          prompt:
            'Suppose one 16x16 block computes a 16x16 tile of C. For one fixed k, how many threads may need the same `A[row, k]` value, and how many may need the same `B[k, col]` value?',
          placeholder: 'Write the reuse count you expect inside one output tile before revealing the reference reading.'
        },
        tabs: [
          {
            kind: 'source',
            label: 'Source view',
            language: 'cpp',
            body: `__global__ void matmul_naive(float* C, const float* A, const float* B, int M, int N, int K) {
  int row = blockIdx.y * blockDim.y + threadIdx.y;
  int col = blockIdx.x * blockDim.x + threadIdx.x;
  if (row < M && col < N) {
    float acc = 0.0f;
    for (int k = 0; k < K; ++k) {
      acc += A[row * K + k] * B[k * N + col];
    }
    C[row * N + col] = acc;
  }
}`
          },
          {
            kind: 'evidence',
            label: 'Evidence view',
            language: 'text',
            body: 'Inside one 16x16 C tile and one fixed k, threads in the same output row all need the same A[row, k], while threads in the same output column all need the same B[k, col]. This establishes overlapping input demand inside the block and creates an opportunity for redundant traffic if those requests are repeatedly served from far away.'
          },
          {
            kind: 'interpretation',
            label: 'Machine reading',
            language: 'text',
            body: 'The arithmetic loop is not the whole story. The block creates overlapping demand for the same input values across neighboring threads. Tiling matters because it gives the block a way to turn that overlap into explicit local reuse.'
          }
        ]
      },
      {
        type: 'inlineFigure',
        label: 'machine view',
        id: 'matmul-reuse-accounting',
        title: 'One fixed k, many repeated requests',
        caption:
          'The point is not the exact hardware transaction count yet. The point is that the same A and B values can be needed by many neighboring threads in the same output tile.',
        rows: [
          ['one A[row, k]', 'needed by up to 16 threads across one C-tile row'],
          ['one B[k, col]', 'needed by up to 16 threads across one C-tile column'],
          ['naive effect', 'overlapping input demand can create an opportunity for redundant traffic'],
          ['tiling motive', 'load once per tile phase, reuse many times inside the block']
        ]
      },
      {
        type: 'paragraph',
        text:
          'The first useful lens is to stop admiring the triple loop and start auditing traffic. The kernel is no longer just “one thread computes one dot product.” It is also a machine that chooses how often the same input values travel from global memory to the threads that need them.'
      },
      {
        type: 'reviewSet',
        title: 'Memory trace: repeated traffic in naive matmul',
        label: 'memory trace',
        intro: 'These cards compress the repeated-traffic story before any shared-memory code appears.',
        feedback:
          'If this felt fuzzy, freeze one output tile and one fixed k. Then ask which threads share the same A value and which share the same B value.',
        cards: [
          {
            id: 'matmul.naive.one_thread_one_c',
            prompt: 'In the simplest CUDA matmul, one thread usually computes one what?',
            answer: 'One output element of C, usually one `C[row, col]` accumulator.'
          },
          {
            id: 'matmul.naive.shared_a_value',
            prompt: 'Inside one output tile and one fixed k, which neighboring threads can need the same `A[row, k]` value?',
            answer: 'Threads in the same output row but different output columns can need the same `A[row, k]`.'
          },
          {
            id: 'matmul.naive.shared_b_value',
            prompt: 'Inside one output tile and one fixed k, which neighboring threads can need the same `B[k, col]` value?',
            answer: 'Threads in the same output column but different output rows can need the same `B[k, col]`.'
          },
          {
            id: 'matmul.naive.transfer_overlap',
            kind: 'transfer',
            prompt: 'If neighboring threads compute neighboring columns of the same output row, which matrix is the obvious overlap candidate for one fixed k?',
            answer: 'A is the obvious overlap candidate, because those threads share the same output row and therefore the same `A[row, k]` value.'
          },
          {
            id: 'matmul.naive.debug_traffic',
            kind: 'debugging',
            prompt: 'A naive matmul is correct but bandwidth-heavy. Before changing arithmetic, what traffic issue should you suspect?',
            answer: 'Repeated global-memory loads of A and B values that many neighboring threads need simultaneously.'
          },
          {
            id: 'matmul.naive.integrating_rereads',
            kind: 'integrating',
            prompt: 'Why is “one thread computes one dot product” an incomplete performance explanation?',
            answer: 'Because performance also depends on how much overlapping input traffic the whole block generates while those threads compute their dot products.'
          }
        ]
      },
      {
        type: 'paragraph',
        text:
          'You can now read naive matmul as a repeated-traffic machine, not just as a triple loop. That is the descent point where tiling becomes necessary rather than ornamental.'
      },
      {
        type: 'paragraph',
        kicker: 'Mystery',
        text:
          'Once repeated traffic is the problem, what exactly should one block own? Tiling starts by making one block responsible for one tile of C, then deriving which slice of A and which slice of B that ownership implies.'
      },
      {
        type: 'artifact',
        label: 'code lens + prediction',
        title: 'Artifact 2: one block can own one C tile',
        caption:
          'Ownership comes first. Shared-memory staging only makes sense after the block knows which output tile it is responsible for producing.',
        unitPattern: ['phenomenon', 'code', 'prediction', 'machine view', 'evidence', 'memory trace'],
        prediction: {
          id: 'artifact.matmul_tile.ownership_prediction',
          prompt:
            'For block `(by, bx)` computing a `BM x BN` tile of C in the first `BK` phase, which slice of A and which slice of B must the block bring closer?',
          placeholder: 'Name the C tile, the matching A rows/k-range, and the matching B k-range/columns before revealing the reference reading.'
        },
        tabs: [
          {
            kind: 'source',
            label: 'Source view',
            language: 'cpp',
            body: `constexpr int BM = 16;
constexpr int BN = 16;
constexpr int BK = 16;

int block_row = blockIdx.y * BM;
int block_col = blockIdx.x * BN;
int row = block_row + threadIdx.y;
int col = block_col + threadIdx.x;`
          },
          {
            kind: 'evidence',
            label: 'Evidence view',
            language: 'text',
            body: 'If the block owns `C[block_row : block_row + BM, block_col : block_col + BN]`, then for the first phase it needs `A[block_row : block_row + BM, 0 : BK]` and `B[0 : BK, block_col : block_col + BN]`. Later phases advance the k-slice while the C tile ownership stays fixed.'
          },
          {
            kind: 'interpretation',
            label: 'Machine reading',
            language: 'text',
            body: 'A block can turn repeated long trips into a smaller number of shared trips. Ownership of one C tile determines the exact A rows and B columns that are worth staging for one k-phase.'
          }
        ]
      },
      {
        type: 'inlineFigure',
        label: 'machine view',
        id: 'ctile-ownership-map',
        title: 'Owning one C tile determines the input slices',
        caption:
          'The block does not load “some shared memory.” It loads the precise A and B slices needed to update its current C tile for one k-range.',
        rows: [
          ['block owns', 'C[block_row : block_row + BM, block_col : block_col + BN]'],
          ['A slice for one phase', 'A[block_row : block_row + BM, tile_k : tile_k + BK]'],
          ['B slice for one phase', 'B[tile_k : tile_k + BK, block_col : block_col + BN]'],
          ['what stays fixed', 'the C tile ownership'],
          ['what advances', 'the k-range across phases']
        ]
      },
      {
        type: 'paragraph',
        text:
          'The key simplification is geometric. The block no longer sees the whole matrix multiply. It sees one output tile and a sequence of input tile pairs that must flow through it. A block can turn repeated long trips into a smaller number of shared trips.'
      },
      {
        type: 'reviewSet',
        title: 'Memory trace: C-tile ownership',
        label: 'memory trace',
        intro: 'These cards make tile ownership explicit before we talk about synchronization.',
        feedback:
          'If this felt slippery, freeze one block. First name its C tile. Then ask which rows of A and which columns of B are relevant for the current k phase.',
        cards: [
          {
            id: 'matmul.tile.block_owns_ctile',
            prompt: 'In a tiled CUDA matmul, what does a block usually own first: one C tile, one full row of C, or the whole matrix?',
            answer: 'One tile of C.'
          },
          {
            id: 'matmul.tile.a_slice',
            prompt: 'If a block owns one C tile for the current k phase, what A slice does it need?',
            answer: 'The rows that match the C tile and the current k-range for that phase.'
          },
          {
            id: 'matmul.tile.b_slice',
            prompt: 'If a block owns one C tile for the current k phase, what B slice does it need?',
            answer: 'The current k-range and the columns that match the C tile.'
          },
          {
            id: 'matmul.tile.transfer_shift_right',
            kind: 'transfer',
            prompt: 'If the block moves one tile to the right in C while keeping the same k phase, which input slice changes most obviously?',
            answer: 'The B slice changes columns to match the new C tile, while the A rows for that block row remain the same for that phase.'
          },
          {
            id: 'matmul.tile.integrating_geometry',
            kind: 'integrating',
            prompt: 'Why is tile ownership a better starting point than shared-memory syntax?',
            answer: 'Because ownership tells you which output region the block must update and therefore exactly which A and B data are worth staging.'
          }
        ]
      },
      {
        type: 'reviewSet',
        title: 'Shared staging and reuse',
        intro: 'Now connect ownership to storage choice: which values deserve shorter travel paths?',
        feedback:
          'If this was missed, ask whether a value is reused by many threads in the block. Shared memory helps only when the block is actually creating local reuse or a cleaner access path.',
        cards: [
          {
            id: 'matmul.shared.why_stage_tiles',
            prompt: 'Why stage A and B tiles in shared memory during tiled matmul?',
            answer: 'Because many threads in the block reuse those tile values across many multiply-adds, so loading once into shared memory can replace many global loads.'
          },
          {
            id: 'matmul.shared.accumulator_register',
            prompt: 'Where does each thread usually keep its partial C accumulator while iterating through tile phases?',
            answer: 'In registers.'
          },
          {
            id: 'matmul.shared.not_all_values',
            prompt: 'Why is putting arbitrary per-thread temporaries into shared memory not automatically a good idea?',
            answer: 'Shared memory is useful for block-level reuse or improved access structure, not for values that stay private and are used once.'
          },
          {
            id: 'matmul.shared.transfer_single_use',
            kind: 'transfer',
            prompt: 'If a value is used once by one thread and never by neighbors, should shared memory be your first choice?',
            answer: 'No. That value is a better register candidate if resources allow, because shared memory adds coordination overhead without block-level reuse.'
          },
          {
            id: 'matmul.shared.debug_no_gain',
            kind: 'debugging',
            prompt: 'A tiled kernel adds shared memory but barely speeds up. Name one structural reason to suspect before micro-tuning.',
            answer: 'The staged values may not actually be reused enough to justify the synchronization and shared-memory resource cost.'
          }
        ]
      },
      {
        type: 'paragraph',
        text:
          'You can now read a block as a reuse agreement: it owns one C tile, stages the matching A and B tile slices, and spends scarce on-chip memory only when the shorter path pays for itself.'
      },
      {
        type: 'paragraph',
        kicker: 'Mystery',
        text:
          'Shared memory explains where the data sits. It does not yet explain when it is safe to reuse or overwrite it. The tiled loop only becomes correct when each phase has a clear handoff boundary.'
      },
      {
        type: 'artifact',
        label: 'code lens + prediction',
        title: 'Artifact 3: tiled reuse needs two barriers',
        caption:
          'The first barrier makes the tile readable. The second barrier makes the next overwrite legal. The point is the repeating phase structure, not the exact micro-optimization yet.',
        unitPattern: ['phenomenon', 'code', 'prediction', 'machine view', 'evidence', 'memory trace'],
        prediction: {
          id: 'artifact.matmul_sync.two_barriers_prediction',
          prompt:
            'Why is one barrier after the tile load not always enough? Identify what could be overwritten too early when the loop advances to the next k phase.',
          placeholder: 'Write which reads are still in flight and which shared arrays may be overwritten before reveal.'
        },
        tabs: [
          {
            kind: 'source',
            label: 'Source view',
            language: 'cpp',
            body: `for (int tile_k = 0; tile_k < K; tile_k += BK) {
  As[threadIdx.y][threadIdx.x] = A[(block_row + threadIdx.y) * K + (tile_k + threadIdx.x)];
  Bs[threadIdx.y][threadIdx.x] = B[(tile_k + threadIdx.y) * N + (block_col + threadIdx.x)];
  __syncthreads();

  for (int kk = 0; kk < BK; ++kk) {
    acc += As[threadIdx.y][kk] * Bs[kk][threadIdx.x];
  }

  // Missing barrier before the next phase overwrites As and Bs.
}`
          },
          {
            kind: 'evidence',
            label: 'Evidence view',
            language: 'text',
            body: 'The first barrier orders producers before consumers read the tile. But when the loop advances, some threads may still be reading the current tile while others are ready to overwrite `As` and `Bs` with the next phase. The phase handoff itself also needs ordering.'
          },
          {
            kind: 'interpretation',
            label: 'Machine reading',
            language: 'text',
            body: 'Tiled reuse is a repeating producer-consumer pipeline: load, make readable, compute, make overwrite-safe, then load again. The second barrier is not decorative. It protects the handoff between tile phases.'
          }
        ]
      },
      {
        type: 'inlineFigure',
        label: 'machine view',
        id: 'tile-phase-timeline',
        title: 'Each tile phase has two boundaries',
        caption:
          'One boundary protects the first read of the tile. The other protects the first overwrite by the next phase.',
        rows: [
          ['phase 1 load', 'threads write As and Bs for tile_k'],
          ['barrier 1', 'the tile becomes readable'],
          ['phase 1 compute', 'threads consume As and Bs across kk'],
          ['barrier 2', 'the tile becomes overwrite-safe'],
          ['phase 2 load', 'the next k-slice can replace As and Bs']
        ]
      },
      {
        type: 'paragraph',
        text:
          'This is the moment where tiled matmul stops looking like magic and starts looking mechanical. The kernel is a little loom: load one pattern into the block, use it many times, then do not touch the next pattern until the old one has been completely consumed.'
      },
      {
        type: 'reviewSet',
        title: 'Memory trace: tiled reuse and two barriers',
        label: 'memory trace',
        intro: 'These cards stabilize the phase structure before we talk about tile size and performance evidence.',
        feedback:
          'If this felt vague, separate the two jobs. Barrier one makes the just-loaded tile readable. Barrier two makes the current tile overwrite-safe before the next phase starts writing.',
        cards: [
          {
            id: 'matmul.sync.first_barrier',
            prompt: 'What does the first barrier after loading `As` and `Bs` protect?',
            answer: 'It ensures the block has finished writing the current tile before threads read from it.'
          },
          {
            id: 'matmul.sync.second_barrier',
            prompt: 'What does the second barrier before the next tile load protect?',
            answer: 'It ensures no thread is still reading the current shared-memory tile when the next phase begins overwriting it.'
          },
          {
            id: 'matmul.sync.scope',
            prompt: 'The tiled matmul barriers coordinate which scope: one thread, one block, or the whole grid?',
            answer: 'One block.'
          },
          {
            id: 'matmul.sync.transfer_neighbor_tile',
            kind: 'transfer',
            prompt: 'If one thread may still read `As[ty][kk]` while another starts storing the next phase into `As[ty][tx]`, what class of bug should you suspect?',
            answer: 'A producer-consumer ordering bug caused by a missing or misplaced block-level barrier between tile phases.'
          },
          {
            id: 'matmul.sync.integrating_pipeline',
            kind: 'integrating',
            prompt: 'Why is tiled matmul better read as a repeating phase pipeline than as one long loop?',
            answer: 'Because correctness and performance both depend on the handoff between repeated load, compute, and overwrite phases.'
          }
        ]
      },
      {
        type: 'paragraph',
        text:
          'You can now read tiled code as a repeating load-compute-handover pipeline, not as one monolithic loop. The next question is not whether tiling helps, but how aggressively to tile before resource costs push back.'
      },
      {
        type: 'paragraph',
        kicker: 'Mystery',
        text:
          'Why can the same tiled idea speed one kernel up and make another one stall? Tile size changes two things at once: it can increase reuse, but it also increases demands on shared memory, registers, and active parallelism.'
      },
      {
        type: 'inlineFigure',
        label: 'evidence',
        id: 'tile-size-tradeoff-map',
        title: 'Tile size is a tradeoff map, not a magic number',
        caption:
          'A larger tile strengthens the reuse claim only by making stronger resource claims on the machine at the same time.',
        rows: [
          ['larger tile may improve', 'reuse per tile phase and arithmetic work per load'],
          ['larger tile also raises', 'shared-memory bytes per block'],
          ['larger tile often pressures', 'register use and active blocks per SM'],
          ['measurement question', 'did the extra reuse outweigh the resource cost here?']
        ]
      },
      {
        type: 'artifact',
        label: 'benchmark receipt',
        title: 'Artifact 4: a matmul optimization claim needs a receipt',
        caption:
          'The official CUDA best-practices guide reports concrete V100 bandwidth numbers for one documented shared-memory matmul example. The receipt supports an optimization mechanism in that example, not a universal tuning law.',
        unitPattern: ['phenomenon', 'code', 'prediction', 'machine view', 'evidence', 'memory trace'],
        prediction: {
          id: 'artifact.matmul_measurement.receipt_prediction',
          prompt:
            'Before seeing the reported numbers, which variant would you expect to win: no shared memory, shared memory for A, or shared memory to eliminate redundant B reads? Explain your guess in one sentence.',
          placeholder: 'Predict the ranking and the mechanism you expect to explain it.'
        },
        tabs: [
          {
            kind: 'source',
            label: 'Source view',
            language: 'text',
            body: `Official NVIDIA matmul example on a Tesla V100:
No optimization: 119.9 GB/s
Shared memory for a tile of A: 144.4 GB/s
Shared memory to eliminate redundant reads of a tile of B: 195.5 GB/s`
          },
          {
            kind: 'evidence',
            label: 'Evidence view',
            language: 'text',
            body: 'NVIDIA reports 119.9 GB/s for the unoptimized kernel, 144.4 GB/s after using shared memory for a tile of A, and 195.5 GB/s after using shared memory to eliminate redundant reads of a tile of B on a Tesla V100. Those numbers support the claim that this documented optimization mechanism improved effective bandwidth in that example.'
          },
          {
            kind: 'interpretation',
            label: 'Machine reading',
            language: 'text',
            body: 'This is a receipt for one matmul optimization mechanism on one GPU. It shows that shared memory can matter when a block creates reuse and avoids redundant global transfers, but it is not a universal tuning law. It does not by itself choose a tile size for your kernel; a local tuning claim still needs matrix shapes, tile dimensions, GPU model, synchronization method, and profiler context.'
          }
        ]
      },
      {
        type: 'reviewSet',
        title: 'Tile size and measurement',
        intro: 'The final cards keep tile size from turning into superstition.',
        feedback:
          'If this was missed, remember that a larger tile buys more reuse only by spending more shared memory, registers, and sometimes occupancy.',
        cards: [
          {
            id: 'matmul.tile_size.not_biggest',
            prompt: 'Is the largest tile size that fits in shared memory automatically the best choice?',
            answer: 'No. Larger tiles may improve reuse but can also reduce occupancy, increase register pressure, or make other bottlenecks dominate.'
          },
          {
            id: 'matmul.tile_size.shared_bytes',
            prompt: 'At a high level, what shared-memory cost grows when you enlarge the staged A and B tiles?',
            answer: 'The block must store more tile data on-chip, so shared-memory usage per block grows.'
          },
          {
            id: 'matmul.tile_size.tradeoff',
            prompt: 'Name three things tile size negotiates at once.',
            answer: 'Data reuse, shared-memory consumption, and register/occupancy pressure.'
          },
          {
            id: 'matmul.measurement.receipt',
            prompt: 'What must travel with a claim that one tile size beat another?',
            answer: 'GPU model, matrix sizes, tile sizes, timing method, synchronization method, repetitions or warmup, and preferably profiler context.'
          },
          {
            id: 'matmul.measurement.transfer_arch',
            kind: 'transfer',
            prompt: 'A tile size wins on one GPU but loses on another. What should you suspect first?',
            answer: 'Architecture-specific resource tradeoffs or memory-system behavior, not a universal tile-size law.'
          },
          {
            id: 'matmul.measurement.integrating_receipt',
            kind: 'integrating',
            prompt: 'Why is tile-size tuning better treated as evidence-driven negotiation than as a search for one magic number?',
            answer: 'Because the best tile size depends on the hardware, problem shape, and resource tradeoffs visible only through measurement and profiling.'
          }
        ]
      },
      {
        type: 'paragraph',
        text:
          'You can now treat tile size as a resource negotiation among reuse, on-chip storage, and active parallelism. A bigger tile is a stronger reuse claim, but also a stronger demand for scarce resources.'
      },
      {
        type: 'paragraph',
        text:
          'One final bridge from the first essay matters here: production tiled kernels do not live in a perfect rectangular world. Partial tiles and edge tiles appear whenever M, N, or K does not divide the tile shape cleanly. That means boundary handling is needed around global loads and C stores, and sometimes around the final kk work of a partial K phase as well.'
      },
      {
        type: 'paragraph',
        text:
          'The mental model is the same one you already built in The Thread Atlas. The launch is rectangular because hardware likes regular work. Bounds guards and predicates are what make the irregular edge legal. Tiling changes the geometry of data movement; it does not eliminate the need for legality boundaries.'
      },
      {
        type: 'paragraph',
        text:
          'Tiling is not an optimization trick. It is a way of reshaping data movement. The same arithmetic becomes faster because the machine is asked to move and reuse data in a more coherent pattern.'
      }
    ]
  },
  {
    slug: 'compiler',
    title: 'The Tensor Mill',
    subtitle: 'A compiler essay about expressions, lowering, and schedules',
    author: 'Mnemonic Medium Lab',
    deckDescription:
      'A discovery-style tensor-programming essay about expressions, IR, lowering, and bufferization. The goal is to make compiler transformations feel like visible changes in meaning, storage, and iteration.',
    sections: [
      {
        type: 'paragraph',
        kicker: 'Opening question',
        text:
          'The same matmul can appear as a math expression, a tensor IR op, a loop nest, a buffered program, or a GPU sketch. Why does the compiler need that many faces if the arithmetic never changes?'
      },
      {
        type: 'paragraph',
        text:
          'The short answer is that different faces preserve different truths. A tensor expression preserves meaning. A structured IR preserves iteration and reuse opportunities. Bufferization chooses storage. Lowering chooses where the work will actually run. The compiler is not trying to erase the original computation; it is trying to keep the useful structure visible for as long as possible.'
      },
      {
        type: 'paragraph',
        text:
          'This essay starts with the same matmul you saw in The Tile Loom, but it reads it from the compiler side. We will ask what a tensor value means, how IR records that meaning, when bufferization turns value semantics into storage semantics, and how lowering keeps the schedule explicit enough to optimize.'
      },
      {
        type: 'paragraph',
        text:
          'Keep three questions nearby. What does the tensor value mean? What structure is still visible in IR? What storage or schedule choice finally changes the machine behavior?'
      },
      {
        type: 'reviewSet',
        title: 'Tensor semantics basics',
        intro: 'These cards keep tensor meaning separate from physical storage.',
        feedback:
          'If this felt fuzzy, remember that a tensor value is a semantic object first. Its layout and storage plan are not the same thing as the value itself.',
        cards: [
          {
            id: 'compiler.tensor.value_semantics',
            prompt: 'What is the first thing a tensor value represents in a modern tensor compiler: meaning or physical storage?',
            answer: 'Meaning. The value tells you what the tensor denotes before any specific buffer layout is chosen.'
          },
          {
            id: 'compiler.tensor.shape_rank',
            prompt: 'What do shape and rank tell you about a tensor?',
            answer: 'Shape describes the extents of each dimension, and rank is the number of dimensions.'
          },
          {
            id: 'compiler.tensor.layout_not_semantics',
            prompt: 'Is row-major layout the same thing as tensor semantics?',
            answer: 'No. Row-major is one possible physical layout; the tensor meaning is independent of that choice.'
          },
          {
            id: 'compiler.tensor.transfer_broadcast',
            kind: 'transfer',
            prompt: 'If two different memory layouts can represent the same tensor expression, what should you infer about the layout?',
            answer: 'That layout is a physical choice, not the tensor expression itself.'
          },
          {
            id: 'compiler.tensor.debug_shape_bug',
            kind: 'debugging',
            prompt: 'A tensor expression has the wrong output shape after a transformation. What should you suspect before blaming code generation?',
            answer: 'A broken shape or indexing transformation, not necessarily a codegen bug.'
          }
        ]
      },
      {
        type: 'artifact',
        label: 'code lens + prediction',
        title: 'Artifact 1: one matmul in five views',
        caption:
          'Watch one computation become easier to inspect as the representation changes: first meaning, then iteration, then locality, then mapping.',
        unitPattern: ['phenomenon', 'code', 'prediction', 'machine view', 'evidence', 'memory trace'],
        prediction: {
          id: 'artifact.compiler.five_faces_prediction',
          prompt:
            'Before revealing the pipeline, which view would you trust for mathematical meaning, and which view would you inspect when tuning locality or GPU mapping?',
          placeholder: 'Predict which view keeps meaning safest and which view exposes execution decisions.'
        },
        tabs: [
          {
            kind: 'source',
            label: 'Source view',
            language: 'text',
            body: `math view:
  C = A @ B

tensor IR view:
  %c = linalg.matmul ins(%a, %b : tensor<MxKxf32>, tensor<KxNxf32>)
                     outs(%c0 : tensor<MxNxf32>)

structured-op view:
  iterators = [parallel, parallel, reduction]
  maps = (i,k), (k,j), (i,j)

loop-nest view:
  for i, j, k:
    C[i,j] += A[i,k] * B[k,j]

GPU-mapping view:
  block owns one C tile; threads load A/B tiles and accumulate`
          },
          {
            kind: 'evidence',
            label: 'Evidence view',
            language: 'text',
            body: 'The views answer different questions. The math view preserves meaning; tensor IR keeps typed values; the structured op exposes iteration and access maps; the loop nest exposes order and locality; the GPU sketch exposes mapping and storage choices.'
          },
          {
            kind: 'interpretation',
            label: 'Machine reading',
            language: 'text',
            body: 'The point is not to memorize five names. It is to watch the compiler keep meaning stable while making more execution questions inspectable. Each lowering step keeps some information and makes other information explicit.'
          }
        ]
      },
      {
        type: 'inlineFigure',
        label: 'machine view',
        id: 'tensor-faces-map',
        title: 'One computation, five readable faces',
        caption:
          'The point is not that one representation is better in every situation. The point is that each one makes a different part of the machine visible.',
        rows: [
          ['math', 'preserves meaning'],
          ['tensor IR', 'preserves value semantics and structure'],
          ['structured op', 'preserves iteration pattern'],
          ['loop nest', 'exposes locality and order'],
          ['GPU sketch', 'shows mapping and storage']
        ]
      },
      {
        type: 'paragraph',
        text:
          'You can now read a compiler pipeline as a sequence of visibility changes. The first job is not to optimize; it is to stop hiding the structure you still need later.'
      },
      {
        type: 'reviewSet',
        title: 'IR and SSA',
        intro: 'These cards keep the source language and the compiler IR apart.',
        feedback:
          'If this was missed, remember that SSA values are not reassigned. IR is there to make structure explicit enough to transform.',
        cards: [
          {
            id: 'compiler.ir.ast_vs_ir',
            prompt: 'Why does a compiler often prefer IR over raw AST for optimization?',
            answer: 'IR is usually closer to the transformations the compiler wants to perform, and it makes analysis and rewriting easier.'
          },
          {
            id: 'compiler.ir.ssa_basic',
            prompt: 'What does SSA mean at a high level?',
            answer: 'Each value is assigned once, which makes dependencies and data flow easier to reason about.'
          },
          {
            id: 'compiler.ir.op_result',
            prompt: 'In a small IR, what does an operation usually have that a source expression may hide?',
            answer: 'Explicit operands, results, types, and often attributes that a compiler can inspect and transform.'
          },
          {
            id: 'compiler.ir.transfer_violation',
            kind: 'transfer',
            prompt: 'If a value appears to be reassigned in an SSA IR, what should you suspect?',
            answer: 'Either you are not reading SSA correctly or the IR is malformed; SSA values themselves should not be reassigned.'
          },
          {
            id: 'compiler.ir.debug_missing_type',
            kind: 'debugging',
            prompt: 'A transformation loses track of a result shape. What part of the IR should you inspect first?',
            answer: 'The op, its result type, and any shape or attribute information the pass needs to preserve.'
          }
        ]
      },
      {
        type: 'artifact',
        label: 'code lens + prediction',
        title: 'Artifact 2: bufferization changes the storage contract',
        caption:
          'Tensor semantics and storage semantics are not the same thing. Bufferization is where the compiler decides how values will live in memory while trying to preserve meaning.',
        unitPattern: ['phenomenon', 'code', 'prediction', 'machine view', 'evidence', 'memory trace'],
        prediction: {
          id: 'artifact.compiler.bufferization_prediction',
          prompt:
            'Before reveal, what do you expect bufferization to preserve, and what do you expect it to choose?',
          placeholder: 'Predict which parts of the computation stay semantic and which parts become storage decisions.'
        },
        tabs: [
          {
            kind: 'source',
            label: 'Source view',
            language: 'text',
            body: `%t0 = tensor.empty() : tensor<MxNxf32>
%t1 = linalg.matmul ins(%a, %b : tensor<MxKxf32>, tensor<KxNxf32>)
                     outs(%t0 : tensor<MxNxf32>)`
          },
          {
            kind: 'evidence',
            label: 'Evidence view',
            language: 'text',
            body: 'Bufferization converts tensor semantics into explicit buffer semantics when the pipeline needs storage. That may reuse an existing destination, or it may insert copies when reuse would be unsafe.'
          },
          {
            kind: 'interpretation',
            label: 'Machine reading',
            language: 'text',
            body: 'The arithmetic stays the same, but the compiler now has to pick physical locations and lifetimes. This is the moment where value semantics start to become memory planning.'
          }
        ]
      },
      {
        type: 'inlineFigure',
        label: 'machine view',
        id: 'tensor-buffer-boundary',
        title: 'Tensor meaning crosses a buffer boundary',
        caption:
          'Bufferization is the handoff from semantic value to explicit storage. The compiler keeps the math, but it now has to choose where the values live.',
        rows: [
          ['before bufferization', 'tensor values and SSA flow'],
          ['boundary', 'storage plan is chosen'],
          ['after bufferization', 'memrefs and explicit loads/stores'],
          ['risk', 'copies if reuse is unsafe']
        ]
      },
      {
        type: 'paragraph',
        text:
          'You can now separate tensor meaning from buffer placement. That separation is the reason compilers can optimize a computation without first collapsing it into raw machine instructions.'
      },
      {
        type: 'reviewSet',
        title: 'Bufferization and aliasing',
        intro: 'These cards keep the storage decision honest.',
        feedback:
          'If this was missed, ask which part of the pipeline is choosing memory and which part is still preserving tensor meaning.',
        cards: [
          {
            id: 'compiler.bufferization.to_memref',
            prompt: 'What does bufferization mainly do at a high level?',
            answer: 'It converts tensor semantics into explicit buffer semantics so later passes can operate on memory.'
          },
          {
            id: 'compiler.bufferization.dps',
            prompt: 'Why does destination-passing style matter for bufferization?',
            answer: 'Because it gives the compiler an explicit destination buffer to try to reuse instead of always allocating a new one.'
          },
          {
            id: 'compiler.bufferization.copy_insertion',
            prompt: 'When might bufferization insert a copy?',
            answer: 'When reusing an existing buffer would be unsafe because of aliasing or lifetime conflicts.'
          },
          {
            id: 'compiler.bufferization.transfer_reuse',
            kind: 'transfer',
            prompt: 'If a tensor result already has a safe destination, what should bufferization try first?',
            answer: 'Reuse the destination buffer if the aliasing and lifetime analysis says it is safe.'
          },
          {
            id: 'compiler.bufferization.debug_alias',
            kind: 'debugging',
            prompt: 'A bufferized program has an unexpected copy. What should you inspect before blaming codegen?',
            answer: 'The destination, aliasing, and lifetime assumptions that determined whether reuse was safe.'
          }
        ]
      },
      {
        type: 'paragraph',
        text:
          'Bufferization is where the compiler starts to spend memory on purpose. The useful question is not “did it lower?” but “what did it choose to keep in place, and what did it choose to move?”'
      },
      {
        type: 'paragraph',
        kicker: 'Mystery',
        text:
          'If bufferization chooses storage, what does lowering still need to decide? The remaining question is how to expose iteration, tiling, and scheduling so that the machine can actually run the plan well.'
      },
      {
        type: 'artifact',
        label: 'code lens + prediction',
        title: 'Artifact 3: lowering keeps structure until schedule chooses execution',
        caption:
          'Lowering is not a single magic step. It is a sequence of increasingly concrete choices that preserve meaning until the pipeline commits to loops, buffers, and mapping.',
        unitPattern: ['phenomenon', 'code', 'prediction', 'machine view', 'evidence', 'memory trace'],
        prediction: {
          id: 'artifact.compiler.lowering_prediction',
          prompt:
            'Before reveal, which information do you expect to survive longest through lowering: tensor meaning, iteration structure, or physical storage details?',
          placeholder: 'Predict what stays visible longest and what becomes explicit first.'
        },
        tabs: [
          {
            kind: 'source',
            label: 'Source view',
            language: 'text',
            body: `tensor IR -> structured op -> loop nest -> bufferized loads/stores -> GPU mapping`
          },
          {
            kind: 'evidence',
            label: 'Evidence view',
            language: 'text',
            body: 'Lowering keeps the meaning longest, then exposes iteration structure, then makes execution choices more concrete. Bufferization owns the storage contract; scheduling owns choices such as tiling, fusion, vectorization, and GPU mapping.'
          },
          {
            kind: 'interpretation',
            label: 'Machine reading',
            language: 'text',
            body: 'The compiler is choosing where the computation will happen and what data movement it will require, but it should not have to invent the computation from scratch. Lowering is where schedule becomes concrete while semantics are still recoverable.'
          }
        ]
      },
      {
        type: 'inlineFigure',
        label: 'machine view',
        id: 'lowering-pipeline-map',
        title: 'Lowering is a visibility pipeline',
        caption:
          'Each stage makes a different part of the machine more explicit. The point is not to erase structure too early.',
        rows: [
          ['tensor op', 'semantic value'],
          ['structured op', 'iteration and reuse'],
          ['loops', 'ordering and locality'],
          ['buffers', 'storage and lifetime'],
          ['GPU mapping', 'blocks, threads, and memory movement']
        ]
      },
      {
        type: 'reviewSet',
        title: 'Structured ops and indexing maps',
        intro: 'These cards keep the iteration space visible before the schedule turns concrete.',
        feedback:
          'If this was missed, focus on the indexing pattern. A structured op is about what indices read what inputs, not just about how the source line looks.',
        cards: [
          {
            id: 'compiler.indexing.parallel_vs_reduction',
            prompt: 'In a structured matmul-like op, what is the role of the reduction dimension?',
            answer: 'It is the dimension that accumulates partial results rather than producing an output element directly.'
          },
          {
            id: 'compiler.indexing_map_basic',
            prompt: 'Why are indexing maps useful in a tensor compiler?',
            answer: 'They describe how iteration space maps to operand accesses, which helps the compiler reason about structure and tiling.'
          },
          {
            id: 'compiler.indexing_map_transform',
            prompt: 'What should happen when you change an indexing map?',
            answer: 'The access pattern or semantics of the structured op should change in a controlled, explicit way.'
          },
          {
            id: 'compiler.indexing.transfer_transpose',
            kind: 'transfer',
            prompt: 'If an op becomes a transpose-like access pattern after lowering, what information was already present in the structured form?',
            answer: 'The access pattern over indices; lowering made it explicit rather than inventing it.'
          },
          {
            id: 'compiler.indexing.debug_wrong_reduction',
            kind: 'debugging',
            prompt: 'A structured matmul lowers with the wrong accumulation order. What should you inspect first?',
            answer: 'The reduction dimension, indexing map, and any pass that may have changed iteration structure.'
          }
        ]
      },
      {
        type: 'paragraph',
        text:
          'You can now read lowering as a series of increasingly concrete commitments. The useful structure survives long enough for tiling and schedule choices to act on it.'
      },
      {
        type: 'reviewSet',
        title: 'Schedule vs semantics',
        intro: 'These cards stop schedule from being confused with meaning.',
        feedback:
          'If this was missed, separate what the program means from where and how the compiler decides to run it.',
        cards: [
          {
            id: 'compiler.schedule_vs_semantics.basic',
            prompt: 'What is the difference between schedule and semantics in a tensor compiler?',
            answer: 'Semantics describe what the computation means; schedule describes how the compiler arranges it for execution.'
          },
          {
            id: 'compiler.schedule_vs_semantics.tiling',
            prompt: 'Why is tiling usually a schedule decision rather than a semantic change?',
            answer: 'Because tiling changes how work is arranged and reused, not what mathematical result the computation should produce.'
          },
          {
            id: 'compiler.schedule_vs_semantics.cost_model',
            prompt: 'What does a cost model help the compiler choose?',
            answer: 'Which schedule or lowering choice is likely to be best for a given hardware and problem shape.'
          },
          {
            id: 'compiler.schedule.transfer_tile_loom',
            kind: 'transfer',
            prompt: 'How does the compiler essay connect to The Tile Loom?',
            answer: 'The compiler exposes the tile and reuse structure that The Tile Loom already made physically visible in CUDA.'
          },
          {
            id: 'compiler.schedule.integrating_lens',
            kind: 'integrating',
            prompt: 'What new lens should you have after reading the compiler essay?',
            answer: 'You should be able to separate tensor meaning from buffer placement and schedule choices.'
          }
        ]
      },
      {
        type: 'paragraph',
        text:
          'The Tensor Mill is the point where the matmul story changes from hardware intuition to transformation intuition. The same reuse structure still matters, but now the question is how a compiler preserves it while turning it into a concrete execution plan.'
      },
      {
        type: 'paragraph',
        text:
          'You can now separate tensor meaning from buffer placement and schedule choice. Once that split is visible, compiler passes stop feeling like black-box magic and start feeling like a disciplined sequence of visibility changes.'
      }
    ]
  },
  {
    slug: 'tilelang',
    title: 'The TileLang Forge',
    subtitle: 'A TileLang essay about tiles, schedules, and generated code',
    author: 'Mnemonic Medium Lab',
    deckDescription:
      'A discovery-style TileLang essay about how tile ownership, data movement, and schedule choices become a written kernel and a generated receipt. The goal is to turn TileLang into a reusable authorship lens rather than a black box.',
    sections: [
      {
        type: 'paragraph',
        kicker: 'Opening question',
        text:
          'What changes when you stop writing a kernel as raw thread choreography and start writing it as a tile-shaped plan? TileLang is interesting because it lets you state the plan in the same units the machine cares about: tiles, memory scopes, stages, and the schedule that connects them.'
      },
      {
        type: 'paragraph',
        text:
          'This essay treats TileLang as the place where authorship becomes explicit. The source should tell you what each tile owns, what data moves between scopes, which config values shape the schedule, and which schedule choices are only claims until generated code and a receipt prove them. Because TileLang evolves quickly, version and lowering receipts are part of the lesson, not an appendix.'
      },
      {
        type: 'paragraph',
        text:
          'Keep three questions nearby as you read. What tile does this kernel own? What data lives in global, shared, or fragment scope between phases? What evidence proves that the schedule you wrote is the schedule the compiler actually honored?'
      },
      {
        type: 'reviewSet',
        title: 'TileLang positioning',
        intro: 'These cards keep TileLang in the right place between CUDA and compiler thinking.',
        feedback:
          'If this feels fuzzy, remember that TileLang is not a replacement for CUDA. It is a higher-level way to write tile-shaped kernels while still depending on GPU concepts and compiler lowering.',
        cards: [
          {
            id: 'tilelang.positioning.dsl_definition',
            prompt: 'What is TileLang in one sentence?',
            answer:
              'A Pythonic DSL on top of TVM for writing high-performance GPU and CPU kernels around tile-shaped dataflow and schedules.'
          },
          {
            id: 'tilelang.positioning.not_cuda_replacement',
            prompt: 'Why does TileLang not eliminate the need for CUDA concepts?',
            answer:
              'Because performance still depends on blocks, memory hierarchy, synchronization, coalescing, and resource tradeoffs.'
          },
          {
            id: 'tilelang.positioning.generated_code',
            prompt: 'Why should a TileLang tutorial inspect generated code?',
            answer: 'To verify that the compiler honored the intended tile and schedule story after lowering.'
          },
          {
            id: 'tilelang.positioning.version_lock',
            prompt: 'Why should a TileLang essay record version and environment details?',
            answer: 'Because APIs and lowering details evolve quickly, and receipts only make sense relative to a specific build and hardware setup.'
          },
          {
            id: 'tilelang.positioning.transfer_cuda_lens',
            kind: 'transfer',
            prompt: 'If you already know CUDA tiled matmul, what new thing does TileLang add?',
            answer:
              'A way to write tile ownership, memory movement, and schedule more directly while still reasoning about the lowered machine.'
          }
        ]
      },
      {
        type: 'artifact',
        label: 'tile map',
        title: 'Artifact 1: the first kernel names an ownership tile',
        caption:
          'A TileLang kernel should make the launch and the slice it owns obvious before you ever think about tuning.',
        prediction: {
          id: 'artifact.tilelang.first_kernel_prediction',
          prompt:
            'For a vector-style kernel launched over a rounded-up tile, what does each program instance own, and what should the final partial slice do?',
          placeholder: 'Predict the owned slice and the legal edge behavior before revealing the kernel sketch.'
        },
        tabs: [
          {
            kind: 'source',
            label: 'Source view',
            language: 'python',
            body: `import tilelang.language as T
from tilelang import jit

@T.prim_func
def add_kernel(
    A: T.Tensor((N,), 'float32'),
    B: T.Tensor((N,), 'float32'),
    C: T.Tensor((N,), 'float32'),
):
    with T.Kernel(T.ceildiv(N, 128), threads=128) as (bx,):
        for tx in T.Parallel(128):
            i = bx * 128 + tx
            if i < N:
                C[i] = A[i] + B[i]`
          },
          {
            kind: 'evidence',
            label: 'Evidence view',
            language: 'text',
            body: 'TileLang makes the launch read like an ownership map. `T.Kernel` states the launch context, `T.Parallel` keeps the within-tile work regular, and the guard makes the final partial slice legal instead of accidental.'
          },
          {
            kind: 'interpretation',
            label: 'Machine reading',
            language: 'text',
            body: 'You can now read a TileLang kernel as a tile map rather than as a generic function call. The source declares which slice each program instance owns, and the machine can lower that declaration without hiding the ownership question.'
          }
        ]
      },
      {
        type: 'inlineFigure',
        label: 'machine view',
        id: 'tile-ownership-map',
        title: 'One program instance owns one slice',
        caption:
          'The first win is not speed. It is that ownership becomes visible before any tuning begins.',
        rows: [
          ['launch context', 'how many tile owners exist'],
          ['owned slice', 'which data region one instance is responsible for'],
          ['edge guard', 'what makes the final partial slice legal'],
          ['why this matters', 'TileLang reads like a plan, not just a function body']
        ]
      },
      {
        type: 'paragraph',
        text:
          'You can now read the launch as a contract rather than a stencil. The program instance, the tile, and the edge guard are all part of one visible plan.'
      },
      {
        type: 'reviewSet',
        title: 'Tile and memory scopes',
        intro: 'These cards connect tile ownership to storage choices.',
        feedback:
          'If this feels slippery, remember the hierarchy: global memory is far away, shared memory is block-local, and fragment or register storage is where short-lived partial results usually belong.',
        cards: [
          {
            id: 'tilelang.tile.core_purpose',
            prompt: 'What is the core purpose of a tile in TileLang?',
            answer: 'To act as the shared unit of movement, reuse, computation, and schedule.'
          },
          {
            id: 'tilelang.scope.shared_vs_fragment',
            prompt: 'What is the usual difference between shared and fragment storage?',
            answer:
              'Shared storage is block-visible and good for reuse across threads; fragment storage is closer to a private accumulator or per-thread working space.'
          },
          {
            id: 'tilelang.copy.path',
            prompt: 'When you see `T.copy(src, dst)`, what should you ask first?',
            answer: 'Where the source lives, where the destination lives, and what tile shape or access path is being moved.'
          },
          {
            id: 'tilelang.gemm.k_phase',
            prompt: 'Why is the K dimension special in tiled GEMM?',
            answer: 'Because it is the reduction dimension whose partial sums accumulate into the same C tile across phases.'
          },
          {
            id: 'tilelang.scope.transfer_shared_candidate',
            kind: 'transfer',
            prompt: 'If many threads in a block reuse the same tile values, which storage scope is the natural candidate?',
            answer: 'Shared memory, because the data is block-local and reused by multiple threads.'
          }
        ]
      },
      {
        type: 'paragraph',
        kicker: 'Mystery',
        text:
          'Why does a GEMM kernel become easier to write once the tile and the scopes are explicit? Because the block stops being a vague patch of threads and starts being a reusable contract about where A, B, and C live during each phase.'
      },
      {
        type: 'artifact',
        label: 'dataflow sketch',
        title: 'Artifact 2: GEMM turns dataflow into buffer choreography',
        caption:
          'The interesting part of TileLang GEMM is not that it hides the machine. It is that it writes the machine’s tile choreography directly.',
        prediction: {
          id: 'artifact.tilelang.gemm_prediction',
          prompt:
            'Before reveal, which buffers do you expect to sit in shared memory, which buffer should hold partial sums, and what should the loop over K be doing?',
          placeholder: 'Predict the A/B/C roles and the phase structure before revealing the skeleton.'
        },
        tabs: [
          {
            kind: 'source',
            label: 'Source view',
            language: 'python',
            body: `BM, BN, BK = 128, 128, 32
A_s = T.alloc_shared((BM, BK), dtype)
B_s = T.alloc_shared((BK, BN), dtype)
C_f = T.alloc_fragment((BM, BN), accum_dtype)
T.clear(C_f)

for ko in T.Pipelined(T.ceildiv(K, BK), num_stages=3):
    T.copy(A[by * BM, ko * BK], A_s)
    T.copy(B[ko * BK, bx * BN], B_s)
    T.gemm(A_s, B_s, C_f)

T.copy(C_f, C[by * BM, bx * BN])`
          },
          {
            kind: 'evidence',
            label: 'Evidence view',
            language: 'text',
            body: 'The source already states the dataflow: the block owns one C tile, stages A and B in shared memory for each K phase, and keeps partial sums in a fragment buffer while `T.Pipelined` overlaps movement and compute. The point is not to hide the machine, but to make the movement explicit enough that lowering can preserve it.'
          },
          {
            kind: 'interpretation',
            label: 'Machine reading',
            language: 'text',
            body: 'You can now author dataflow directly. Shared memory is one explicit stop in a tile journey that begins in global memory, passes through shared or fragment scope, and returns to output only when the phase is done.'
          }
        ]
      },
      {
        type: 'inlineFigure',
        label: 'machine view',
        id: 'tile-dataflow-stack',
        title: 'TileLang exposes a dataflow stack',
        caption:
          'TileLang gives the reader a way to point at each layer of the machine instead of inferring it indirectly from low-level code.',
        rows: [
          ['global', 'input and output tensors'],
          ['shared', 'block-local staged tiles'],
          ['fragment', 'partial sums or short-lived working state'],
          ['pipeline', 'overlap between copy and compute'],
          ['result', 'what gets copied back after the tile phases finish']
        ]
      },
      {
        type: 'paragraph',
        text:
          'You can now author dataflow directly. Shared memory is no longer a magical optimization knob; it is one explicit stop in a tile journey that begins in global memory, passes through shared or fragment scope, and returns to output only when the phase is done.'
      },
      {
        type: 'reviewSet',
        title: 'Pipelining and schedule',
        intro: 'These cards keep the overlap story honest.',
        feedback:
          'If this felt vague, remember that schedule is a claim about overlap and order, not a claim that the compiler will invent a better algorithm for you.',
        cards: [
          {
            id: 'tilelang.pipeline.overlap',
            prompt: 'What does `T.Pipelined` try to overlap?',
            answer: 'The movement and compute phases that would otherwise happen strictly one after another.'
          },
          {
            id: 'tilelang.pipeline.not_always_better',
            prompt: 'Does increasing pipeline stages always make a kernel faster?',
            answer: 'No. More stages can improve overlap, but they can also increase resource pressure or scheduling overhead.'
          },
          {
            id: 'tilelang.pipeline.block_k',
            prompt: 'What changes when `block_K` grows?',
            answer: 'The amount of work and reuse in each K phase grows, but shared-memory and resource pressure can also rise.'
          },
          {
            id: 'tilelang.pipeline.async_copy',
            prompt: 'Why might `T.async_copy` matter in a tuned kernel?',
            answer: 'It can make global-to-shared movement explicit enough to overlap with compute, but it still needs correct waiting and synchronization.'
          },
          {
            id: 'tilelang.pipeline.transfer_schedule',
            kind: 'transfer',
            prompt: 'If a larger tile makes a kernel slower, what class of tradeoff should you suspect before blaming TileLang itself?',
            answer: 'A reuse-versus-resource tradeoff, such as shared-memory pressure, register pressure, or reduced occupancy.'
          }
        ]
      },
      {
        type: 'paragraph',
        kicker: 'Mystery',
        text:
          'What does a schedule claim really promise? Not that the compiler will invent a better algorithm, but that the same tile plan can be lowered into a different overlap pattern, a different launch shape, or a different memory path.'
      },
      {
        type: 'artifact',
        label: 'receipt',
        title: 'Artifact 3: a schedule claim needs a generated-code receipt',
        caption:
          'A TileLang schedule claim needs separate receipts for lowering fidelity, correctness, and performance.',
        prediction: {
          id: 'artifact.tilelang.receipt_prediction',
          prompt:
            'Before reveal, what do you most want the lowered code to prove: that the tile plan survived, that the overlap happened, or that the performance claim is tied to one concrete config?',
          placeholder: 'Write the proof obligation you expect the receipt to satisfy.'
        },
        tabs: [
          {
            kind: 'source',
            label: 'Source view',
            language: 'python',
            body: `@tilelang.autotune(configs=matmul_configs, warmup=25, rep=100, timeout=60)
@tilelang.jit(out_idx=[-1])
def matmul(
    M: int,
    N: int,
    K: int,
    block_M: int = 128,
    block_N: int = 128,
    block_K: int = 32,
    threads: int = 128,
    num_stages: int = 3,
    dtype: str = 'float16',
    accum_dtype: str = 'float32',
):
    @T.prim_func
    def kernel(A: T.Tensor((M, K), dtype),
               B: T.Tensor((K, N), dtype),
               C: T.Tensor((M, N), dtype)):
        with T.Kernel(T.ceildiv(N, block_N), T.ceildiv(M, block_M), threads=threads) as (bx, by):
            A_s = T.alloc_shared((block_M, block_K), dtype)
            B_s = T.alloc_shared((block_K, block_N), dtype)
            C_f = T.alloc_fragment((block_M, block_N), accum_dtype)
            T.clear(C_f)
            for ko in T.Pipelined(T.ceildiv(K, block_K), num_stages=num_stages):
                T.copy(A[by * block_M, ko * block_K], A_s)
                T.copy(B[ko * block_K, bx * block_N], B_s)
                T.gemm(A_s, B_s, C_f)
            T.copy(C_f, C[by * block_M, bx * block_N])
    return kernel`
          },
          {
            kind: 'evidence',
            label: 'Receipt excerpt',
            language: 'text',
            body: `A useful TileLang receipt has three separate checks:

lowering receipt:
  cache artifact: device_kernel.cu or printed CUDA source
  excerpt:
    __shared__ half A_s[128][32];
    __shared__ half B_s[32][128];
    for (int ko = 0; ko < ceildiv(K, 32); ++ko) {
      // global -> shared copies for the next A/B tiles
      // wait/sync for the staged tiles
      // mma/gemm updates the C fragment
    }
    // fragment C -> global C store

correctness receipt:
  ref_prog: torch.allclose(C, (A @ B).to(C.dtype), rtol=1e-2, atol=1e-2) -> pass

performance receipt:
  config: block_M=128, block_N=128, block_K=32, num_stages=3, threads=128
  shape: M=N=K=1024, dtype=float16, accum=float32
  timing: warmup=25, rep=100, backend=CUDA events
  cache: best_config.json + latency.json saved with the tuned kernel`
          },
          {
            kind: 'interpretation',
            label: 'Machine reading',
            language: 'text',
            body: 'Keep the proof obligations separate. Generated code proves whether the schedule was lowered into the structure you intended. A reference check proves whether the output is correct. A benchmark or profiler proves whether this config improved performance on this hardware and shape. A fast benchmark cannot prove lowering fidelity, and a faithful lowering cannot prove speed.'
          }
        ]
      },
      {
        type: 'inlineFigure',
        label: 'evidence',
        id: 'schedule-receipt',
        title: 'Source, lowering, and receipt belong together',
        caption:
          'A TileLang tuning story is only complete when the source claim, config, lowered behavior, and receipt all travel together.',
        rows: [
          ['source claim', 'block_M, block_N, block_K, stages, threads'],
          ['lowering receipt', 'generated CUDA/TIR shows copy, gemm, pipeline, store'],
          ['correctness receipt', 'reference check passes within stated tolerance'],
          ['performance receipt', 'benchmark or profiler evidence on one GPU and shape'],
          ['what it proves', 'each receipt proves only its own claim scope']
        ]
      },
      {
        type: 'reviewSet',
        title: 'Generated code and tuning receipts',
        intro: 'These cards stop the schedule from becoming a superstition.',
        feedback:
          'If this was missed, separate the authored plan from the lowered execution and from the benchmark receipt. They are related, but they are not the same thing.',
        cards: [
          {
            id: 'tilelang.receipt.generated_code',
            prompt: 'Why inspect generated code in a TileLang workflow?',
            answer: 'To verify that the compiler actually honored the intended tile and schedule story after lowering.'
          },
          {
            id: 'tilelang.receipt.autotuner',
            prompt: 'What does the TileLang autotuner do at a high level?',
            answer: 'It searches a configuration space, compiles candidates, validates correctness, benchmarks them, and keeps the best result for reuse.'
          },
          {
            id: 'tilelang.receipt.must_travel',
            prompt: 'What must travel with a tuning claim for it to be readable later?',
            answer: 'Version, GPU model, input shape, configuration values, timing method, and ideally the lowered code or profiler context.'
          },
          {
            id: 'tilelang.receipt.transfer_gpu',
            kind: 'transfer',
            prompt: 'If one TileLang config wins on one GPU but loses on another, what should you suspect first?',
            answer: 'Architecture-specific resource tradeoffs or memory-system behavior, not a universal tuning law.'
          },
          {
            id: 'tilelang.receipt.integrating_lens',
            kind: 'integrating',
            prompt: 'What new lens should you have after the TileLang essay?',
            answer:
              'You should be able to separate the authored tile plan, the lowered execution path, and the benchmark receipt that proves the claim.'
          }
        ]
      },
      {
        type: 'paragraph',
        text:
          'You can now treat TileLang as authorship of a machine contract: a tile plan in source, a lowered path in generated code, and a receipt that proves the claim on a particular GPU and shape. That is what makes the forge useful. It turns schedule from hidden labor into an inspectable decision.'
      },
      {
        type: 'paragraph',
        text:
          'A shorter lab track lives at `#/tilelang/labs`. It turns the same ideas into three exercises: first-kernel ownership, GEMM tile anatomy, and schedule receipt inspection.'
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
    afterTitle: 'Memory trace: ownership and launch geometry',
    paragraphs: [
      'Once indexing is clear, the next question is what the hardware can do with all these threads. CUDA exposes threads because they are the unit the programmer reasons about, but the machine often schedules them in groups. That gap between the programming unit and the scheduling intuition is not a nuisance. It is where many performance explanations live.',
      'A single thread is too small a lens for performance. If one lane reads a float, you know almost nothing. If thirty-two neighboring lanes read thirty-two neighboring floats, you know something important: the memory system has a clean pattern to work with. Likewise, if neighboring lanes branch in different directions, you have learned something about the instruction stream. CUDA performance is frequently a story about neighborhoods, not individuals.',
      'This is also why the same code can feel simple and subtle at the same time. The line `out[i] = a[i] + b[i]` is simple. The question of whether the lanes executing that line have good addresses, enough occupancy, and no hidden synchronization bottleneck is not simple. The essay will keep returning to this two-level view: one thread explains correctness; a neighborhood of threads explains much of performance.',
      'You can now separate thread existence from memory permission. A launch tells you which threads exist; the bounds guard tells you which of those threads are allowed to touch real data.'
    ]
  },
  {
    afterTitle: 'Bounds guards',
    paragraphs: [
      'Bounds guards have a reputation as boilerplate, but boilerplate is exactly what should become fluent. If you have to stop and re-derive why `i < n` is there every time, you are spending attention on the wrong layer. The guard should become a small invariant you can trust while thinking about deeper behavior.',
      'The hidden danger is that missing guards may fail politely. A CPU program with an out-of-bounds bug may crash in a way that feels direct. A GPU kernel can instead corrupt a neighboring buffer, produce a plausible number, or fail only at certain input sizes. This is why the final partial block is not a corner case to handle later; it is the test of whether you understand the launch geometry at all.',
      'Notice the distinction between a guard and an algorithmic condition. `i < n` says whether a thread corresponds to a valid element. `keep[i]` or `a[i] > 0` says whether the valid element should participate in the algorithm. Mixing those two ideas is a common way to write kernels that are locally readable but globally fragile.',
      'You can now read a guard as a legality boundary, not just as defensive boilerplate. It marks the edge where a launched thread stops being merely real and starts being permitted to touch memory.'
    ]
  },
  {
    afterTitle: 'Warp and SIMT intuition',
    paragraphs: [
      'The warp is where the essay starts to become less like ordinary programming. In ordinary scalar code, a branch is a private choice made by one control flow. In CUDA, a branch can become a group event. If different lanes in a warp want different paths, the hardware still has to issue instructions in a way that respects those choices. The result is not usually a correctness bug, but it can be a performance tax.',
      'Do not turn this into superstition. Branches are not poison. A branch that splits whole blocks may be cheap enough. A branch that is rarely executed may not matter. A branch whose cost is hidden behind memory latency may not dominate. The useful habit is narrower: when performance looks odd, ask whether neighboring lanes are still doing the same kind of work at the same time.',
      'This idea prepares us for coalescing. Divergence asks whether neighboring lanes take neighboring instruction paths. Coalescing asks whether neighboring lanes touch neighboring addresses. The two topics feel different in code, but they share a visual habit: stop staring at one lane and draw the warp.',
      'You can now inspect a branch as a neighborhood event, not just a private choice of one thread. The machine cost depends on whether nearby lanes stay together or split apart.'
    ]
  },
  {
    afterTitle: 'Memory hierarchy first pass',
    paragraphs: [
      'Memory hierarchy is where many CUDA tutorials become a list of storage names. That list is not the point. The point is distance, visibility, and reuse. Registers are close and private. Shared memory is close and block-local. Global memory is large and visible, but comparatively far away. You should read every storage choice as a claim about who needs the data and how often it will be reused.',
      'A useful mental image is a workshop. Registers are the tools in one worker’s hands. Shared memory is the workbench shared by one small team. Global memory is the warehouse. Walking to the warehouse for every screw is legal, but if the team will use the same screws many times, bringing a box to the bench changes the work. That is the story behind many tiled kernels.',
      'The local memory name is an especially good warning that vocabulary can mislead. Local sounds close, but in CUDA it means local to a thread in the programming model, not necessarily stored in fast nearby hardware. If too many per-thread values exceed register capacity, spills can make a kernel slower in ways that surprise people who only read variable scopes.',
      'You can now read a storage choice as a claim about who needs the data, how far it travels, and whether reuse can justify bringing it closer.'
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
    afterTitle: 'Memory trace: warp address patterns',
    paragraphs: [
      'Coalescing is satisfying because it turns invisible hardware behavior into something you can often sketch with pencil marks. Write lane numbers across a row. Under each lane, write the address it requests. If the addresses march forward compactly, the pattern is friendly. If they leap across memory, the pattern is suspicious. This is not the full architectural rulebook, but it is a good first instrument.',
      'The matrix case makes the idea concrete. In row-major storage, moving across a row touches adjacent memory; moving down a column jumps by the row stride. A warp that maps lanes across a row tends to have an easier time than a warp that maps lanes down a column. This is why layout and thread mapping become inseparable once performance matters.',
      'Microbenchmark papers and roofline analyses exist because real machines add detail to this simple picture. Cache levels, memory partitions, instruction mix, predication, and shared-memory behavior can all matter. The beginner mistake is not having a simplified model. The mistake is forgetting that the simplified model is a starting point, not a law of nature.',
      'You can now read a memory access as a warp-shaped address bundle. The source line may mention one index expression, but the machine sees a neighborhood of lanes requesting a pattern of addresses together.'
    ]
  },
  {
    afterTitle: 'Shared memory scope',
    paragraphs: [
      'Shared memory is the first CUDA feature that feels like a small social contract. Threads in a block agree to use a common scratchpad. Some threads put data there; other threads read it; together they avoid repeated trips to global memory. But a social contract needs rules. Who participates? Only the block. How long does the scratchpad live? For the block’s execution. When is it safe to read? Only after the relevant writes are complete.',
      'This is why shared memory appears together with synchronization in so many kernels. The memory space gives threads a place to cooperate; the barrier gives them a moment at which cooperation becomes well-defined. Without the barrier, the code may look like a team but behave like a crowd entering a room through different doors at different times.',
      'The next essay on matrix multiplication will make this tangible. A block will load a tile of A and a tile of B, then reuse those tiles for many multiply-adds. The performance payoff comes from reuse. The correctness condition comes from synchronization. The resource tradeoff comes from the limited size of the shared scratchpad and registers.',
      'You can now read shared memory as a local data-movement bargain: more coordination and limited on-chip space in exchange for shorter, more reusable paths through the machine.'
    ]
  },
  {
    afterTitle: 'Memory trace: barriers and producer-consumer phases',
    paragraphs: [
      'Synchronization bugs are unpleasant because they often look like ghosts. The code is deterministic as text, but the schedule is not a single tidy sequence. If one thread reads before another thread writes, the program may sometimes see yesterday’s value, sometimes today’s value, and sometimes a value that merely looks plausible.',
      'The most important distinction is scope. `__syncthreads()` is a meeting for one block. It is not a meeting for the whole grid. If you need every block to finish phase one before any block begins phase two, you usually need a different kernel launch, a cooperative-groups design, or another explicit mechanism. Treating a block barrier as a grid barrier is one of those mistakes that can survive small tests and fail under scale.',
      'Atomic operations solve a different problem. A barrier says: everyone in this scope has arrived here. An atomic update says: this particular shared update should not be interleaved with another update to the same location. You can need one, the other, both, or neither. Keeping those concepts separate prevents a lot of cargo-cult synchronization.',
      'You can now read shared memory code as a producer-consumer timeline. The important question is no longer “does this kernel use shared memory?” but “which writes must finish before which reads become legal?”'
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
      'The point is not to frighten you away from simple models. The point is to earn better models gradually. At the end of this first essay, you should be able to inspect a small kernel and ask useful questions: Who owns each element? Which lanes branch together? Which lanes touch neighboring addresses? Which memory space holds the reused data? What synchronization makes the cooperation legal? What measurement would prove or disprove my explanation?',
      'You can now treat a performance number as a hypothesis with a receipt. A benchmark is not a verdict by itself; it becomes useful only when hardware, input size, synchronization, and measurement method travel with it.',
      'A CUDA kernel is not just scalar code repeated many times. It is a map of ownership, neighborhoods, data movement, and time boundaries.'
    ]
  }
];

const cudaInlineFigureInsertions = [
  {
    afterTitle: 'Artifact 1: vector add is small enough to inspect',
    figure: {
      type: 'inlineFigure',
      label: 'machine view',
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
      label: 'machine view',
      id: 'warp-address-tape',
      title: 'A warp-shaped address tape',
      caption:
        'This is the machine-facing reveal: source code asks for one element per lane, but the memory system sees a bundle of warp addresses.',
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
    afterTitle: 'Artifact 3: broken reduction is a correctness microscope',
    figure: {
      type: 'inlineFigure',
      label: 'machine view',
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
  },
  {
    afterTitle: 'Measurement discipline',
    figure: {
      type: 'inlineFigure',
      label: 'evidence',
      id: 'measurement-receipt',
      title: 'A benchmark needs a receipt',
      caption:
        'A performance claim becomes interpretable only when the timed region, hardware, and synchronization story travel with it.',
      rows: [
        ['GPU + software', 'device model, toolkit, driver'],
        ['problem shape', 'input size, data type, layout'],
        ['timed region', 'what is inside the timer'],
        ['ordering', 'CUDA events or explicit synchronization'],
        ['stability', 'warmup, repeats, profiler context']
      ]
    }
  }
];

const cudaPhenomenonInsertions = [
  {
    beforeTitle: 'Artifact 1: vector add is small enough to inspect',
    paragraph: {
      type: 'paragraph',
      kicker: 'Mystery',
      text:
        'Why can a launch create real GPU threads that exist, execute instructions, and yet have no permission to touch a single array element? The first unit answers that question by making ownership visible.'
    }
  },
  {
    beforeTitle: 'Artifact 2: strided copy makes memory access visible',
    paragraph: {
      type: 'paragraph',
      kicker: 'Mystery',
      text:
        'Two kernels can both copy `n` floats and still feel as though they are running on different hardware. The source-level difference is tiny; the machine-level neighborhood it creates is not.'
    }
  },
  {
    beforeTitle: 'Artifact 3: broken reduction is a correctness microscope',
    paragraph: {
      type: 'paragraph',
      kicker: 'Mystery',
      text:
        'A reduction can look deterministic in source code and still fail because time has not been structured. The interesting question is not whether the code uses shared memory, but where the program has actually declared a safe moment to read it.'
    }
  },
  {
    beforeTitle: 'Shared memory scope',
    paragraph: {
      type: 'paragraph',
      kicker: 'Mystery',
      text:
        'Why can copying unrelated per-thread values into shared memory make a kernel strictly busier, while staging one reused block-local tile can make it meaningfully faster? The name `shared memory` is not the explanation. The explanation is whether a block is actually creating reusable local traffic rather than paying coordination overhead for private data.'
    }
  },
  {
    beforeTitle: 'Measurement discipline',
    paragraph: {
      type: 'paragraph',
      kicker: 'Mystery',
      text:
        'Why can two performance claims conflict when no arithmetic changed? Because timing numbers can disagree even when no arithmetic changed. Often the source code is not the variable at all. The benchmark receipt changed: hardware, warmup, synchronization, timed region, or input size. Performance stories diverge when that receipt goes missing.'
    }
  }
];

enrichPrimaryEssayNarrative();
addCudaPhenomena();
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

function addCudaPhenomena() {
  const essay = essays.find((item) => item.slug === primaryEssaySlug);
  if (!essay || essay._phenomenaAdded) return;

  for (const insertion of cudaPhenomenonInsertions) {
    const index = essay.sections.findIndex((section) => section.title === insertion.beforeTitle);
    if (index === -1) continue;
    essay.sections.splice(index, 0, insertion.paragraph);
  }

  essay._phenomenaAdded = true;
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

export function getLabs(topic) {
  if (topic === 'tilelang') return tilelangLabs;
  return [];
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
